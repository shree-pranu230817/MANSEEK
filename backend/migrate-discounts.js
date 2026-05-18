require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function run() {
  try {
    console.log("Updating first 3 products to have MRP (base_price) = 2000 and Selling Price (sale_price) = 800 (60% OFF discount)...");

    const targets = ['void-oversized-tee', 'ghost-hoodie-bone', 'onyx-sweatshirt'];

    for (const slug of targets) {
      const { data, error } = await supabase
        .from('products')
        .update({
          base_price: 2000,
          sale_price: 800
        })
        .eq('slug', slug)
        .select();

      if (error) {
        throw error;
      }
      console.log(`Updated successfully: ${slug}`, data?.[0]);
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

run();
