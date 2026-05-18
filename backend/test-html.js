async function test() {
  try {
    const res = await fetch('https://manseek.vercel.app/shop');
    const html = await res.text();
    
    const index = html.indexOf('Void Oversized');
    if (index !== -1) {
      console.log("Snippet around Void Oversized Tee:");
      console.log(html.substring(index, index + 2500));
    } else {
      console.log("Void Oversized not found.");
    }
  } catch (err) {
    console.error(err);
  }
}

test();
