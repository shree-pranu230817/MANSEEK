require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function cleanup() {
  try {
    console.log("Starting database catalog cleanup...");

    // 1. Fetch all products that are NOT the initial 3
    const targets = ['void-oversized-tee', 'ghost-hoodie-bone', 'onyx-sweatshirt'];
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .not('slug', 'in', `(${targets.join(',')})`);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${products?.length || 0} products to delete.`);

    if (products && products.length > 0) {
      // 2. Extract image paths to delete from storage
      const filesToDelete = [];
      products.forEach((p) => {
        if (Array.isArray(p.images)) {
          p.images.forEach((imgUrl) => {
            if (imgUrl.includes('product-images/')) {
              const fileName = imgUrl.split('product-images/')[1];
              if (fileName) {
                filesToDelete.push(fileName);
              }
            }
          });
        }
      });

      // 3. Delete files from Supabase Storage
      if (filesToDelete.length > 0) {
        console.log(`Deleting ${filesToDelete.length} image files from Supabase 'product-images' storage bucket...`, filesToDelete);
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove(filesToDelete);

        if (storageError) {
          console.error("Storage deletion warning:", storageError.message);
        } else {
          console.log("Successfully cleaned up all uploaded images from storage!");
        }
      }

      // 4. Hard-delete the products from the table
      const idsToDelete = products.map((p) => p.id);
      console.log(`Deleting product records from database...`);
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        throw deleteError;
      }
      console.log("Successfully hard-deleted all test product records!");
    }

    console.log("Catalog database cleanup complete! Only the initial 3 flagship products remain.");
  } catch (err) {
    console.error("Error during cleanup:", err);
  }
}

cleanup();
