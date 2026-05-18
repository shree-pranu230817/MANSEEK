const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { sendWelcomeEmail } = require('../services/email.service');

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, line1, line2, city, state, pincode } = req.body;
    
    // Check existing
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const password_hash = await bcrypt.hash(password, 12);
    
    const { data: user, error } = await supabase.from('users').insert([{
      name, email, phone, password_hash
    }]).select().single();

    if (error) throw error;

    if (line1) {
      await supabase.from('addresses').insert([{
        user_id: user.id,
        full_name: name,
        phone,
        line1,
        line2,
        city,
        state,
        pincode,
        is_default: true
      }]);
    }

    await sendWelcomeEmail({ to: email, name });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // exclude hash
    delete user.password_hash;
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    delete user.password_hash;
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase.from('users').select('*, addresses(*)').eq('id', req.user.userId).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    
    delete user.password_hash;
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Logged out' });
};

module.exports = { register, login, me, logout };
