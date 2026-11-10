const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

router.post('/abandoned', async (req, res, next) => {
  try {
    const { email, items, subtotal } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart must contain items' });
    }

    const { data, error } = await supabase
      .from('abandoned_carts')
      .insert([{
        email: email || null,
        items,
        subtotal: parseFloat(subtotal) || 0,
        last_active: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.warn('Abandoned cart log skipped (table may be pending migration):', error.message);
      return res.json({ status: 'ok' });
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
