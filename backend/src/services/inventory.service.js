const { supabase } = require('../config/supabase');

/**
 * Adjust stock for a product / variant and record audit movement
 */
const adjustStock = async ({ productId, variantId = null, delta, reason = 'manual_adjustment', orderId = null, note = null, userId = null }) => {
  try {
    // 1. Fetch current product
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, stock, size_stock')
      .eq('id', productId)
      .single();

    if (prodErr || !product) {
      throw new Error(`Product ${productId} not found: ${prodErr?.message}`);
    }

    let stockAfter = (product.stock || 0) + delta;
    if (stockAfter < 0) stockAfter = 0;

    // 2. If variant specified, adjust variant stock
    if (variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id, stock, size')
        .eq('id', variantId)
        .single();

      if (variant) {
        let vStockAfter = (variant.stock || 0) + delta;
        if (vStockAfter < 0) vStockAfter = 0;
        await supabase
          .from('product_variants')
          .update({ stock: vStockAfter, updated_at: new Date().toISOString() })
          .eq('id', variantId);

        // sync size_stock if size present
        if (variant.size && product.size_stock) {
          const currentSizeStock = { ...product.size_stock };
          currentSizeStock[variant.size] = Math.max(0, (currentSizeStock[variant.size] || 0) + delta);
          await supabase
            .from('products')
            .update({ size_stock: currentSizeStock })
            .eq('id', productId);
        }
      }
    }

    // 3. Update main product stock
    await supabase
      .from('products')
      .update({ stock: stockAfter })
      .eq('id', productId);

    // 4. Log to stock_movements
    const { data: movement, error: movErr } = await supabase
      .from('stock_movements')
      .insert([{
        product_id: productId,
        variant_id: variantId,
        delta,
        stock_after: stockAfter,
        reason,
        order_id: orderId,
        note,
        created_by: userId
      }])
      .select()
      .single();

    if (movErr) {
      console.warn('stock_movements log failed (table may require migration):', movErr.message);
    }

    return { success: true, stockAfter, movement };
  } catch (err) {
    console.error('adjustStock error:', err.message);
    throw err;
  }
};

/**
 * Deduct stock atomically when order payment is verified
 */
const deductOrderStock = async (orderId, items, userId = null) => {
  if (!items || !Array.isArray(items)) return;

  for (const item of items) {
    const qty = parseInt(item.quantity) || 1;
    const delta = -qty;

    try {
      await adjustStock({
        productId: item.productId,
        variantId: item.variantId || null,
        delta,
        reason: 'order_sale',
        orderId,
        note: `Order item purchased: ${item.name} (${item.size || 'std'}) x${qty}`,
        userId
      });
    } catch (err) {
      console.error(`Failed to deduct inventory for item ${item.productId}:`, err.message);
    }
  }
};

/**
 * Fetch products and variants at or below their low_stock_threshold
 */
const getLowStockAlerts = async (defaultThreshold = 5) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, stock, low_stock_threshold, images, size_stock, categories(name)')
      .eq('is_active', true);

    if (error) throw error;

    const lowStockItems = [];
    products.forEach((p) => {
      const threshold = p.low_stock_threshold !== undefined && p.low_stock_threshold !== null
        ? p.low_stock_threshold
        : defaultThreshold;

      if ((p.stock || 0) <= threshold) {
        lowStockItems.push({
          ...p,
          threshold,
          alertType: p.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
        });
      }
    });

    return lowStockItems;
  } catch (err) {
    console.error('getLowStockAlerts error:', err.message);
    return [];
  }
};

module.exports = {
  adjustStock,
  deductOrderStock,
  getLowStockAlerts
};

