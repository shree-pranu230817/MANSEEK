const { z } = require('zod');

const orderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  size: z.string(),
  color: z.string().optional(),
  quantity: z.number().int().min(1)
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  addressId: z.string().uuid("Invalid address ID").optional(),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email(),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(6).max(6),
  }).optional(),
  couponCode: z.string().optional().nullable()
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpay_signature: z.string().optional(),
  razorpaySignature: z.string().optional(),
  order_id: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
});

module.exports = { createOrderSchema, verifyPaymentSchema };
