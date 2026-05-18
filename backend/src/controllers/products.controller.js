const { supabase } = require('../config/supabase');

const getProducts = async (req, res, next) => {
  try {
    const { category, size, color, sort, page = 1, limit = 12, search } = req.query;
    
    let query = supabase.from('products').select(`*, categories!inner(slug)`, { count: 'exact' }).eq('is_active', true);
    
    if (category) query = query.eq('categories.slug', category);
    if (size) query = query.contains('sizes', [size]);
    if (color) query = query.contains('colors', JSON.stringify([{ hex: color.toLowerCase() }]));
    if (search) query = query.ilike('name', `%${search}%`);

    const s = sort || 'newest';
    if (s === 'price-asc' || s === 'price_asc') query = query.order('base_price', { ascending: true });
    else if (s === 'price-desc' || s === 'price_desc') query = query.order('base_price', { ascending: false });
    else if (s === 'popular') query = query.order('review_count', { ascending: false });
    else query = query.order('created_at', { ascending: false }); // newest default

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, count, error } = await query;
    if (error) throw error;

    res.json({
      products,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .single();
      
    if (error || !product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductBySlug, getCategories };
