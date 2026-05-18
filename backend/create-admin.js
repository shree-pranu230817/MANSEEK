require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  const email = 'brahmakiran02@gmail.com';
  const password = 'Kiran@002';
  const name = 'Admin';
  
  console.log(`Checking if user ${email} exists...`);
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  
  const password_hash = await bcrypt.hash(password, 12);
  
  if (existing) {
    console.log(`User exists. Updating to admin and updating password...`);
    const { error } = await supabase.from('users').update({
      password_hash,
      role: 'admin'
    }).eq('id', existing.id);
    
    if (error) {
      console.error("Error updating user:", error);
    } else {
      console.log("Admin user updated successfully!");
    }
  } else {
    console.log(`Inserting new admin user...`);
    const { error } = await supabase.from('users').insert([{
      name,
      email,
      password_hash,
      role: 'admin'
    }]);
    
    if (error) {
      console.error("Error inserting user:", error);
    } else {
      console.log("Admin user created successfully!");
    }
  }
}

createAdmin();
