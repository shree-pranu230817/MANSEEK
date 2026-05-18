require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function run() {
  try {
    console.log("Updating first 3 products to have MRP (base_price) = 2000 and Selling Price (sale_price) = 800 (60% OFF discount)...");

    const { data, error } = await supabase
      .from('products')
      .update({
        base_price: 1600,
        sale_price: 300
      })
      .eq('slug', 'plain-white-t-shirt')
      .select();

    if (error) {
      throw error;
    }
    console.log(`Updated successfully: plain-white-t-shirt`, data?.[0]);

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

run();
