const { supabase } = require('../config/supabase');
const { uploadToSupabase } = require('../services/storage.service');

const getDashboardStats = async (req, res, next) => {
  try {
    const { data: deliveredOrders } = await supabase.from('orders').select('total').eq('status', 'delivered');
    const total_revenue = deliveredOrders?.reduce((acc, curr) => acc + curr.total, 0) || 0;

    const { count: orders_today } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]);
    const { count: total_products } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: total_users } = await supabase.from('users').select('*', { count: 'exact', head: true });

    res.json({ total_revenue, orders_today, total_products, total_users });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    
    const imageUrls = [];
    if (req.files) {
      for (const file of req.files) {
        const url = await uploadToSupabase(file);
        imageUrls.push(url);
      }
    }

    // parse JSON fields if coming from multipart
    const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];
    const colors = req.body.colors ? JSON.parse(req.body.colors) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    const { data, error } = await supabase.from('products').insert([{
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      category_id: productData.category_id,
      sizes,
      colors,
      tags,
      images: imageUrls.length > 0 ? imageUrls : (req.body.images ? JSON.parse(req.body.images) : []),
      base_price: parseFloat(productData.base_price),
      sale_price: productData.sale_price ? parseFloat(productData.sale_price) : null,
      stock: parseInt(productData.stock || 0),
      is_featured: productData.is_featured === 'true'
    }]).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const { id } = req.params;

    const updateFields = {};
    if (productData.name !== undefined) updateFields.name = productData.name;
    if (productData.slug !== undefined) updateFields.slug = productData.slug;
    if (productData.description !== undefined) updateFields.description = productData.description;
    if (productData.category_id !== undefined) updateFields.category_id = productData.category_id;
    if (productData.base_price !== undefined) updateFields.base_price = parseFloat(productData.base_price);
    if (productData.stock !== undefined) updateFields.stock = parseInt(productData.stock);
    if (productData.is_active !== undefined) updateFields.is_active = productData.is_active === 'true' || productData.is_active === true;

    if (productData.sizes !== undefined) {
      updateFields.sizes = typeof productData.sizes === 'string' ? JSON.parse(productData.sizes) : productData.sizes;
    }
    if (productData.colors !== undefined) {
      updateFields.colors = typeof productData.colors === 'string' ? JSON.parse(productData.colors) : productData.colors;
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToSupabase(file);
        imageUrls.push(url);
      }
      updateFields.images = imageUrls;
    } else if (productData.images !== undefined) {
      updateFields.images = typeof productData.images === 'string' ? JSON.parse(productData.images) : productData.images;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, users(name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: status.toLowerCase() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, createProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus };
