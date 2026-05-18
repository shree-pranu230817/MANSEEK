const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { z } = require('zod');
const validate = require('../middleware/validate');

const newsletterSchema = z.object({
  email: z.string().email()
});

router.post('/', validate(newsletterSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email, subscribed: true }, { onConflict: 'email' });
      
    if (error) throw error;
    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
