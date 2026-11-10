const { supabase } = require('../config/supabase');

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!productId) return res.status(400).json({ error: 'productId query required' });

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(reviews || []);
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, body } = req.body;
    const userId = req.user?.userId;

    if (!productId || !rating) {
      return res.status(400).json({ error: 'Product ID and rating (1-5) are required' });
    }

    // Check if user has purchased this product for verified badge
    let is_verified = false;
    try {
      const { data: userOrders } = await supabase
        .from('orders')
        .select('items')
        .eq('user_id', userId)
        .eq('status', 'delivered');

      if (userOrders) {
        for (const order of userOrders) {
          if (Array.isArray(order.items) && order.items.some(i => i.productId === productId)) {
            is_verified = true;
            break;
          }
        }
      }
    } catch (_) {}

    const { data: review, error } = await supabase
      .from('reviews')
      .insert([{
        product_id: productId,
        user_id: userId,
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        title: title || '',
        body: body || '',
        is_verified
      }])
      .select('*, users(name)')
      .single();

    if (error) throw error;

    // Recompute product rating and review_count
    try {
      const { data: allReviews } = await supabase.from('reviews').select('rating').eq('product_id', productId);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await supabase
          .from('products')
          .update({ rating: parseFloat(avg.toFixed(1)), review_count: allReviews.length })
          .eq('id', productId);
      }
    } catch (_) {}

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

const getAdminReviews = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, products(name, slug), users(name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_verified, action } = req.body;

    if (action === 'delete') {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      return res.json({ message: 'Review removed' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ is_verified: Boolean(is_verified) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  createReview,
  getAdminReviews,
  moderateReview
};
