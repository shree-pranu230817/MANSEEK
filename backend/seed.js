require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log("Seeding database...");

  // 1. Clear products and categories
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Insert Categories
  const { data: cats, error: catErr } = await supabase.from('categories').insert([
    { name: 'Tees', slug: 'tees', sort_order: 1, image_url: '/images/cat-tees.jpg' },
    { name: 'Hoodies', slug: 'hoodies', sort_order: 2, image_url: '/images/cat-hoodies.jpg' },
    { name: 'Sweatshirts', slug: 'sweatshirts', sort_order: 3, image_url: '/images/cat-sweatshirts.jpg' }
  ]).select();

  if (catErr) {
    console.error("Error inserting categories:", catErr);
    return;
  }
  
  console.log("Inserted categories.");

  const teesId = cats.find(c => c.slug === 'tees').id;
  const hoodiesId = cats.find(c => c.slug === 'hoodies').id;
  const sweatsId = cats.find(c => c.slug === 'sweatshirts').id;

  const sizes = ["S", "M", "L", "XL"];
  const colors = [{ name: "Black", hex: "#0a0a0a" }, { name: "Bone", hex: "#f5f5f0" }];

  // 3. Insert 1 Product per category
  const { error: prodErr } = await supabase.from('products').insert([
    {
      name: 'Void Oversized Tee',
      slug: 'void-oversized-tee',
      category_id: teesId,
      base_price: 500,
      images: ['/images/prod-1.jpg'],
      sizes,
      colors,
      description: 'Heavyweight 280 GSM cotton. Boxy drop-shoulder fit. Pre-washed for zero shrinkage. Built for the street, made to last.',
      stock: 50,
      is_active: true
    },
    {
      name: 'Ghost Hoodie — Bone',
      slug: 'ghost-hoodie-bone',
      category_id: hoodiesId,
      base_price: 500,
      images: ['/images/prod-2.jpg'],
      sizes,
      colors,
      description: 'Brushed fleece interior. Oversized hood, kangaroo pocket, ribbed cuffs. The everyday flex.',
      stock: 30,
      is_active: true
    },
    {
      name: 'Onyx Sweatshirt',
      slug: 'onyx-sweatshirt',
      category_id: sweatsId,
      base_price: 500,
      images: ['/images/sweatshirt-wear.jpg'],
      sizes,
      colors,
      description: 'Premium French Terry. Relaxed fit for effortless layering.',
      stock: 40,
      is_active: true
    }
  ]);

  if (prodErr) {
    console.error("Error inserting products:", prodErr);
    return;
  }

  console.log("Inserted products.");
  console.log("Seeding complete!");
}

seed();
