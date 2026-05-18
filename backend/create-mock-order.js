require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createMockOrder() {
  const email = '99220040214@klu.ac.in';
  
  console.log(`Checking if user ${email} exists...`);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('email', email)
    .single();
    
  if (userError || !user) {
    console.error("Could not find user in database!", userError);
    return;
  }
  
  console.log(`Found user: ${user.name} (ID: ${user.id})`);
  
  console.log("Fetching a product for the mock order...");
  const { data: products } = await supabase.from('products').select('*').limit(2);
  
  if (!products || products.length === 0) {
    console.error("No products found in the database to order!");
    return;
  }
  
  const selectedProd = products[0];
  console.log(`Using product: ${selectedProd.name} (Price: ${selectedProd.base_price})`);

  // Build items snapshot
  const items = [
    {
      productId: selectedProd.id,
      name: selectedProd.name,
      price: parseFloat(selectedProd.base_price),
      quantity: 1,
      image: selectedProd.images?.[0] || "/images/prod-1.jpg"
    }
  ];

  if (products[1]) {
    items.push({
      productId: products[1].id,
      name: products[1].name,
      price: parseFloat(products[1].base_price),
      quantity: 1,
      image: products[1].images?.[0] || "/images/prod-2.jpg"
    });
  }

  // Calculate totals
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping_charge = 100;
  const total = subtotal + shipping_charge;

  // Build a nice shipping address snapshot
  const address = {
    full_name: user.name,
    phone: user.phone || "99220040214",
    line1: "K L University Campus",
    line2: "Green Fields, Vaddeswaram",
    city: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522502"
  };

  const orderNumber = 'MNS-' + Math.floor(100000 + Math.random() * 900000);

  console.log(`Inserting mock order ${orderNumber}...`);
  const { data: order, error: orderError } = await supabase.from('orders').insert([{
    order_number: orderNumber,
    user_id: user.id,
    items,
    address,
    subtotal,
    shipping_charge,
    discount: 0,
    total,
    status: 'confirmed',
    payment_status: 'paid',
    razorpay_order_id: 'rzp_mock_' + Math.random().toString(36).substring(7),
    razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(7),
    estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }]).select().single();

  if (orderError) {
    console.error("Error inserting mock order:", orderError);
  } else {
    console.log(`Mock order placed successfully! Order Number: ${order.order_number}`);
  }
}

createMockOrder();
