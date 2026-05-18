require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables');
}

// We use the service role key for the backend to bypass RLS when necessary.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };
