const { supabase } = require('../config/supabase');
const razorpayService = require('../services/razorpay.service');
const emailService = require('../services/email.service');
const { v4: uuidv4 } = require('uuid');

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { items, addressId, shippingAddress, couponCode } = req.body;
    const userId = req.user.userId;

    // Fetch product details to calculate real subtotal safely
    const productIds = items.map(i => i.productId);
    const { data: products } = await supabase.from('products').select('*').in('id', productIds);
    
    let subtotal = 0;
    const itemsSnapshot = items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      const price = p.sale_price || p.base_price;
      subtotal += price * item.quantity;
      return { ...item, price, name: p.name, image: p.images[0] };
    });

    let discount = 0;
    if (couponCode) {
      // Dummy logic for coupon validation
      const { data: coupon } = await supabase.from('coupons').select('*').eq('code', couponCode).eq('is_active', true).single();
      if (coupon && subtotal >= coupon.min_order_value) {
        discount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
      }
    }

    const shipping_charge = subtotal > 1500 ? 0 : 100;
    const total = subtotal - discount + shipping_charge;

    const receiptId = uuidv4();
    const rzpOrder = await razorpayService.createRazorpayOrder(total, receiptId);

    // Fetch address or use shippingAddress for snapshot
    let address = null;
    if (addressId) {
      const { data: addr } = await supabase.from('addresses').select('*').eq('id', addressId).single();
      address = addr;
    } else if (shippingAddress) {
      address = shippingAddress;
    }

    // Insert pending order
    const { data: order, error } = await supabase.from('orders').insert([{
      user_id: userId,
      items: itemsSnapshot,
      address,
      subtotal,
      shipping_charge,
      discount,
      total,
      coupon_code: couponCode,
      razorpay_order_id: rzpOrder.id
    }]).select().single();

    if (error) throw error;

    res.json({
      id: rzpOrder.id,
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      order_id: order.id,
      receipt: order.id
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const razorpay_order_id = req.body.razorpay_order_id || req.body.razorpayOrderId;
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
    const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature;
    const order_id = req.body.order_id || req.body.orderId;

    const isValid = razorpayService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) return res.status(400).json({ error: 'Invalid payment signature' });

    // Update order
    const { data: order, error } = await supabase.from('orders').update({
      payment_status: 'paid',
      status: 'confirmed',
      razorpay_payment_id,
      razorpay_signature
    }).eq('id', order_id).select('*, users(name, email)').single();

    if (error) throw error;

    // Send email
    if (order.users?.email) {
      await emailService.sendOrderConfirmation({
        to: order.users.email,
        name: order.users.name,
        orderNumber: order.order_number,
        items: order.items,
        total: order.total,
        address: order.address
      });
    }

    res.json({ orderId: order.id, orderNumber: order.order_number });
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('user_id', req.user.userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('id', req.params.id).eq('user_id', req.user.userId).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const trackOrder = async (req, res, next) => {
  try {
    const { orderNumber, email } = req.query;
    // Check both user join or guest email
    const { data, error } = await supabase
      .from('orders')
      .select('status, tracking_number, estimated_delivery, users!inner(email), guest_email')
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Order not found' });
    
    // verify email
    if (data.guest_email !== email && data.users?.email !== email) {
       return res.status(403).json({ error: 'Unauthorized to view this order' });
    }

    res.json({
      status: data.status,
      tracking_number: data.tracking_number,
      estimated_delivery: data.estimated_delivery
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRazorpayOrder, verifyPayment, getUserOrders, getOrderById, trackOrder };
