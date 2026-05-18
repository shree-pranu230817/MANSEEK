async function test() {
  try {
    const res = await fetch('https://manseek.onrender.com/api/products');
    const data = await res.json();
    console.log("LIVE API PRODUCTS RESPONSE:");
    console.log(JSON.stringify(data.products, null, 2));
  } catch (err) {
    console.error("Test query error:", err);
  }
}

test();
