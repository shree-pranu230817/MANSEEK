const { supabase } = require('../config/supabase');

// Default duration in days for newly published products
const DEFAULT_NEW_DURATION_DAYS = 30;

/**
 * Helper to compute whether a product qualifies for the dynamic NEW badge
 */
const computeIsNew = (product, durationDays = DEFAULT_NEW_DURATION_DAYS) => {
  // If product is inactive or draft, never show NEW
  if (product.status && product.status !== 'published') {
    return false;
  }
  if (product.is_active === false) {
    return false;
  }

  // 1. Admin manual override
  if (product.is_new_manual !== undefined && product.is_new_manual !== null) {
    return Boolean(product.is_new_manual);
  }

  // 2. Custom date threshold override
  if (product.new_until) {
    return new Date() < new Date(product.new_until);
  }

  // 3. Dynamic expiry based on published_at
  const publishDate = product.published_at ? new Date(product.published_at) : null;
  if (publishDate && !isNaN(publishDate.getTime())) {
    const elapsedMs = Date.now() - publishDate.getTime();
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    if (elapsedMs >= 0 && elapsedMs < durationMs) {
      return true;
    }
  }

  // 4. Legacy tag fallback
  if (Array.isArray(product.tags) && (product.tags.includes('NEW') || product.tags.includes('New Drop'))) {
    return true;
  }

  return false;
};

const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      size,
      color,
      sort,
      page = 1,
      limit = 12,
      search,
      status = 'published',
      collection
    } = req.query;
    
    let query = supabase
      .from('products')
      .select('*, categories!inner(id, name, slug, image_url, sort_order)', { count: 'exact' });

    // Status filter: by default only published & active products are returned to storefront
    if (status === 'all') {
      // allow all for admin inspection if queried
    } else {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('categories.slug', category);
    }
    if (size) {
      query = query.contains('sizes', [size]);
    }
    if (color) {
      query = query.contains('colors', JSON.stringify([{ hex: color.toLowerCase() }]));
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (collection) {
      query = query.eq('collection_name', collection);
    }

    const s = sort || 'newest';
    if (s === 'price-asc' || s === 'price_asc') {
      query = query.order('base_price', { ascending: true });
    } else if (s === 'price-desc' || s === 'price_desc') {
      query = query.order('base_price', { ascending: false });
    } else if (s === 'popular') {
      query = query.order('review_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false }); // newest default
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rawProducts, count, error } = await query;
    if (error) throw error;

    // Fetch store settings for new duration if available
    let durationDays = DEFAULT_NEW_DURATION_DAYS;
    try {
      const { data: setting } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'new_product_duration_days')
        .single();
      if (setting?.value) {
        durationDays = parseInt(setting.value) || DEFAULT_NEW_DURATION_DAYS;
      }
    } catch (_) {}

    // Augment products with dynamic is_new status
    const products = (rawProducts || []).map((p) => {
      const is_new = computeIsNew(p, durationDays);
      return {
        ...p,
        is_new,
        badge: is_new ? 'NEW' : p.badge || (p.sale_price && p.sale_price < p.base_price ? 'SALE' : null)
      };
    });

    res.json({
      products,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(*), product_variants(*)')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .single();
      
    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const is_new = computeIsNew(product);
    res.json({
      ...product,
      is_new,
      badge: is_new ? 'NEW' : product.badge || (product.sale_price && product.sale_price < product.base_price ? 'SALE' : null)
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
    
    // Default filter for storefront: visible categories
    if (!req.query.include_hidden) {
      query = query.or('is_visible.is.null,is_visible.eq.true');
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getCategories,
  computeIsNew
};
