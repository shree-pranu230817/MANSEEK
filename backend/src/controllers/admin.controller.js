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
    const colors = req.body.colors ? JSON.parse(req.body.colors) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    // size_stock: { S: 10, M: 5, L: 0, XL: 3 }
    let size_stock = {};
    if (req.body.size_stock) {
      size_stock = JSON.parse(req.body.size_stock);
    } else if (req.body.sizes) {
      // legacy fallback: plain sizes array with a shared stock
      const sizesArr = JSON.parse(req.body.sizes);
      const qty = parseInt(productData.stock || 0);
      sizesArr.forEach(s => { size_stock[s] = qty; });
    }

    // Derive sizes (keys with qty > 0) and total stock
    const sizes = Object.entries(size_stock)
      .filter(([, qty]) => qty > 0)
      .map(([s]) => s);
    const stock = Object.values(size_stock).reduce((a, b) => a + Number(b), 0);

    const { data, error } = await supabase.from('products').insert([{
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      category_id: productData.category_id,
      sizes,
      size_stock,
      colors,
      tags,
      images: imageUrls.length > 0 ? imageUrls : (req.body.images ? JSON.parse(req.body.images) : []),
      base_price: parseFloat(productData.base_price),
      sale_price: productData.sale_price ? parseFloat(productData.sale_price) : null,
      stock,
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
    if (productData.is_active !== undefined) updateFields.is_active = productData.is_active === 'true' || productData.is_active === true;

    if (productData.colors !== undefined) {
      updateFields.colors = typeof productData.colors === 'string' ? JSON.parse(productData.colors) : productData.colors;
    }

    // Handle size_stock update (preferred)
    if (productData.size_stock !== undefined) {
      const size_stock = typeof productData.size_stock === 'string'
        ? JSON.parse(productData.size_stock)
        : productData.size_stock;
      updateFields.size_stock = size_stock;
      updateFields.sizes = Object.entries(size_stock).filter(([, qty]) => Number(qty) > 0).map(([s]) => s);
      updateFields.stock = Object.values(size_stock).reduce((a, b) => a + Number(b), 0);
    } else if (productData.sizes !== undefined) {
      // Legacy: admin toggled a size on/off — fetch current size_stock and zero/restore that size
      const newSizes = typeof productData.sizes === 'string' ? JSON.parse(productData.sizes) : productData.sizes;
      // fetch current size_stock
      const { data: current } = await supabase.from('products').select('size_stock').eq('id', id).single();
      let size_stock = current?.size_stock || {};
      // any size not in newSizes gets 0, any new size that had 0 gets 1
      const allSizes = new Set([...Object.keys(size_stock), ...newSizes]);
      allSizes.forEach(s => {
        if (!newSizes.includes(s)) size_stock[s] = 0;
        else if (!size_stock[s]) size_stock[s] = 1;
      });
      updateFields.size_stock = size_stock;
      updateFields.sizes = newSizes;
      updateFields.stock = Object.values(size_stock).reduce((a, b) => a + Number(b), 0);
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
