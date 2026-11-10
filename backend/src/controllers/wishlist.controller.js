const { supabase } = require('../config/supabase');

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, products(*, categories(name, slug))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const { data, error } = await supabase
      .from('wishlists')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' })
      .select('*, products(*)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
