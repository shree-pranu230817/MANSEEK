const { supabase } = require('../config/supabase');
const { uploadToSupabase } = require('../services/storage.service');
const inventoryService = require('../services/inventory.service');
const { v4: uuidv4 } = require('uuid');

// Audit log helper
const logAdminAction = async ({ userId, userEmail, action, entityType, entityId, details, req }) => {
  try {
    await supabase.from('admin_audit_logs').insert([{
      user_id: userId,
      user_email: userEmail || 'admin@manseek.com',
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      details: details || {},
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || null
    }]);
  } catch (err) {
    // Non-blocking if table is not yet migrated
    console.warn('Audit log write skipped:', err.message);
  }
};

// ==========================================
// 1. DASHBOARD STATS & ANALYTICS
// ==========================================
const getDashboardStats = async (req, res, next) => {
  try {
    const { data: deliveredOrders } = await supabase.from('orders').select('total').eq('status', 'delivered');
    const total_revenue = deliveredOrders?.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0) || 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const { count: orders_today } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStr);
    const { count: total_products } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: total_users } = await supabase.from('users').select('*', { count: 'exact', head: true });

    // Pending returns count
    let pending_returns = 0;
    try {
      const { count } = await supabase.from('order_returns').select('*', { count: 'exact', head: true }).eq('status', 'requested');
      pending_returns = count || 0;
    } catch (_) {}

    // Low stock count
    let low_stock_count = 0;
    try {
      const lowItems = await inventoryService.getLowStockAlerts(5);
      low_stock_count = lowItems.length;
    } catch (_) {}

    res.json({
      total_revenue,
      orders_today,
      total_products,
      total_users,
      pending_returns,
      low_stock_count
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsOverview = async (req, res, next) => {
  try {
    // Fetch last 30 days orders
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: orders } = await supabase
      .from('orders')
      .select('total, created_at, status, payment_status, items')
      .gte('created_at', thirtyDaysAgo);

    const paidOrders = (orders || []).filter(o => o.payment_status === 'paid');
    const revenueLast30Days = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    // Group sales by day
    const salesByDay = {};
    paidOrders.forEach(o => {
      const day = o.created_at.split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + (parseFloat(o.total) || 0);
    });

    // Top selling products by frequency
    const productFrequency = {};
    paidOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(i => {
          const key = i.name || i.productId;
          productFrequency[key] = (productFrequency[key] || 0) + (parseInt(i.quantity) || 1);
        });
      }
    });

    const topProducts = Object.entries(productFrequency)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    res.json({
      revenueLast30Days,
      totalPaidOrders: paidOrders.length,
      salesByDay,
      topProducts
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. DYNAMIC CATEGORIES & SUBCATEGORIES
// ==========================================
const getCategoriesAdmin = async (req, res, next) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Attach product counts per category
    const { data: prods } = await supabase.from('products').select('category_id');
    const countMap = {};
    (prods || []).forEach(p => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    const enriched = (categories || []).map(c => ({
      ...c,
      product_count: countMap[c.id] || 0
    }));

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

const createCategoryAdmin = async (req, res, next) => {
  try {
    const { name, slug, description, sort_order, parent_id, is_visible, is_featured_home, assigned_size_group_id } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      image_url = await uploadToSupabase(req.file);
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        sort_order: parseInt(sort_order) || 0,
        image_url: image_url || null,
        parent_id: parent_id || null,
        is_visible: is_visible !== undefined ? (is_visible === 'true' || is_visible === true) : true,
        is_featured_home: is_featured_home !== undefined ? (is_featured_home === 'true' || is_featured_home === true) : true,
        assigned_size_group_id: assigned_size_group_id || null
      }])
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'category.create',
      entityType: 'category',
      entityId: data.id,
      details: { name: data.name, slug: data.slug },
      req
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const updateCategoryAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const updateFields = {};

    if (body.name !== undefined) updateFields.name = body.name;
    if (body.slug !== undefined) updateFields.slug = body.slug;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.sort_order !== undefined) updateFields.sort_order = parseInt(body.sort_order);
    if (body.parent_id !== undefined) updateFields.parent_id = body.parent_id || null;
    if (body.is_visible !== undefined) updateFields.is_visible = body.is_visible === 'true' || body.is_visible === true;
    if (body.is_featured_home !== undefined) updateFields.is_featured_home = body.is_featured_home === 'true' || body.is_featured_home === true;
    if (body.assigned_size_group_id !== undefined) updateFields.assigned_size_group_id = body.assigned_size_group_id || null;

    if (req.file) {
      updateFields.image_url = await uploadToSupabase(req.file);
    } else if (body.image_url !== undefined) {
      updateFields.image_url = body.image_url;
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'category.update',
      entityType: 'category',
      entityId: id,
      details: updateFields,
      req
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const deleteCategoryAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if products exist in category
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', id);
    
    if (count && count > 0) {
      // Soft-delete: toggle visibility off instead of deleting records
      await supabase.from('categories').update({ is_visible: false }).eq('id', id);
      return res.json({ message: 'Category contains active products; it was safely hidden from customer view.' });
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    await logAdminAction({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'category.delete',
      entityType: 'category',
      entityId: id,
      req
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. SIZE GROUPS & SIZES
// ==========================================
const getSizeGroups = async (req, res, next) => {
  try {
    const { data: groups, error } = await supabase
      .from('size_groups')
      .select('*, sizes(*)')
      .order('name');

    if (error) throw error;
    res.json(groups || []);
  } catch (error) {
    next(error);
  }
};

const createSizeGroup = async (req, res, next) => {
  try {
    const { name, code, description, sizes } = req.body;
    const { data: group, error } = await supabase
      .from('size_groups')
      .insert([{ name, code, description }])
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(sizes) && sizes.length > 0) {
      const sizeRows = sizes.map((s, idx) => ({
        size_group_id: group.id,
        name: s.name || s.code,
        code: s.code,
        sort_order: s.sort_order || idx + 1
      }));
      await supabase.from('sizes').insert(sizeRows);
    }

    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

const createSize = async (req, res, next) => {
  try {
    const { size_group_id, name, code, sort_order } = req.body;
    const { data, error } = await supabase
      .from('sizes')
      .insert([{ size_group_id, name, code, sort_order: parseInt(sort_order) || 0 }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const deleteSize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('sizes').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Size deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ATTRIBUTES & ATTRIBUTE OPTIONS
// ==========================================
const getAttributes = async (req, res, next) => {
  try {
    const { data: attrs, error } = await supabase
      .from('attributes')
      .select('*, attribute_options(*)')
      .order('name');

    if (error) throw error;
    res.json(attrs || []);
  } catch (error) {
    next(error);
  }
};

const createAttribute = async (req, res, next) => {
  try {
    const { name, code, type, is_filterable, options } = req.body;
    const { data: attr, error } = await supabase
      .from('attributes')
      .insert([{
        name,
        code,
        type: type || 'select',
        is_filterable: is_filterable !== undefined ? Boolean(is_filterable) : true
      }])
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(options) && options.length > 0) {
      const optRows = options.map((opt, idx) => ({
        attribute_id: attr.id,
        label: opt.label,
        value: opt.value || opt.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        meta: opt.meta || {},
        sort_order: opt.sort_order || idx + 1
      }));
      await supabase.from('attribute_options').insert(optRows);
    }

    res.status(201).json(attr);
  } catch (error) {
    next(error);
  }
};

const createAttributeOption = async (req, res, next) => {
  try {
    const { attribute_id, label, value, meta, sort_order } = req.body;
    const { data, error } = await supabase
      .from('attribute_options')
      .insert([{
        attribute_id,
        label,
        value: value || label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        meta: meta || {},
        sort_order: parseInt(sort_order) || 0
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const deleteAttributeOption = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('attribute_options').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Option deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. PRODUCTS & VARIANTS (WITH OPTIONAL FIELDS & DRAFTS)
// ==========================================
const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    
    // Upload files if provided
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToSupabase(file);
        imageUrls.push(url);
      }
    }

    // Parse JSON fields safely with optional defaults
    const colors = req.body.colors ? (typeof req.body.colors === 'string' ? JSON.parse(req.body.colors) : req.body.colors) : [];
    const tags = req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [];
    const attributes_data = req.body.attributes_data ? (typeof req.body.attributes_data === 'string' ? JSON.parse(req.body.attributes_data) : req.body.attributes_data) : {};

    // Sizing and inventory: completely optional!
    let size_stock = {};
    if (req.body.size_stock) {
      size_stock = typeof req.body.size_stock === 'string' ? JSON.parse(req.body.size_stock) : req.body.size_stock;
    }

    const sizes = Object.entries(size_stock)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([s]) => s);
      
    const stock = Object.values(size_stock).reduce((a, b) => a + Number(b), 0);

    // Dynamic NEW badge timestamps
    const status = productData.status || (productData.is_draft === 'true' || productData.is_draft === true ? 'draft' : 'published');
    const published_at = status === 'published' ? new Date().toISOString() : null;

    // Optional SKU generation if omitted
    const baseSlug = productData.slug || (productData.name ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `product-${Date.now()}`);
    const sku = productData.sku || `MNS-${baseSlug.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: newProd, error } = await supabase.from('products').insert([{
      name: productData.name || 'Untitled Product',
      slug: baseSlug,
      description: productData.description || '',
      category_id: productData.category_id || null,
      size_group_id: productData.size_group_id || null,
      sizes,
      size_stock,
      colors,
      tags,
      attributes_data,
      sku,
      brand: productData.brand || 'MANSEEK',
      material: productData.material || null,
      images: imageUrls.length > 0 ? imageUrls : (req.body.images ? (typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images) : []),
      base_price: productData.base_price ? parseFloat(productData.base_price) : 0,
      sale_price: productData.sale_price ? parseFloat(productData.sale_price) : null,
      cost_price: productData.cost_price ? parseFloat(productData.cost_price) : null,
      stock,
      low_stock_threshold: productData.low_stock_threshold ? parseInt(productData.low_stock_threshold) : 5,
      is_featured: productData.is_featured === 'true' || productData.is_featured === true,
      status,
      published_at,
      new_until: productData.new_until || null,
      is_new_manual: productData.is_new_manual !== undefined && productData.is_new_manual !== '' ? (productData.is_new_manual === 'true' || productData.is_new_manual === true) : null,
      is_active: status !== 'inactive'
    }]).select().single();

    if (error) throw error;

    // Optional: create product_variants rows if variant matrix provided
    if (req.body.variants) {
      const variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      if (Array.isArray(variants)) {
        const vRows = variants.map(v => ({
          product_id: newProd.id,
          size: v.size || 'ONESIZE',
          color: v.color || null,
          stock: parseInt(v.stock) || 0,
          sku: v.sku || `${sku}-${v.size || '1'}`,
          price_override: v.price_override ? parseFloat(v.price_override) : null,
          sale_price_override: v.sale_price_override ? parseFloat(v.sale_price_override) : null,
          option_matrix: v.option_matrix || {}
        }));
        await supabase.from('product_variants').insert(vRows);
      }
    }

    // Initial stock movement record
    if (stock > 0) {
      await inventoryService.adjustStock({
        productId: newProd.id,
        delta: stock,
        reason: 'initial',
        note: 'Initial inventory creation',
        userId: req.user.userId
      });
    }

    await logAdminAction({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'product.create',
      entityType: 'product',
      entityId: newProd.id,
      details: { name: newProd.name, status: newProd.status },
      req
    });

    res.status(201).json(newProd);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const { id } = req.params;

    const updateFields = {};
    if (productData.name !== undefined) updateFields.name = productData.name;
    if (productData.slug !== undefined) updateFields.slug = productData.slug;
    if (productData.description !== undefined) updateFields.description = productData.description;
    if (productData.category_id !== undefined) updateFields.category_id = productData.category_id || null;
    if (productData.size_group_id !== undefined) updateFields.size_group_id = productData.size_group_id || null;
    if (productData.brand !== undefined) updateFields.brand = productData.brand;
    if (productData.material !== undefined) updateFields.material = productData.material;
    if (productData.sku !== undefined) updateFields.sku = productData.sku;
    if (productData.base_price !== undefined) updateFields.base_price = parseFloat(productData.base_price);
    if (productData.sale_price !== undefined) updateFields.sale_price = productData.sale_price ? parseFloat(productData.sale_price) : null;
    if (productData.cost_price !== undefined) updateFields.cost_price = productData.cost_price ? parseFloat(productData.cost_price) : null;
    if (productData.low_stock_threshold !== undefined) updateFields.low_stock_threshold = parseInt(productData.low_stock_threshold);
    if (productData.is_featured !== undefined) updateFields.is_featured = productData.is_featured === 'true' || productData.is_featured === true;
    
    // Status and publish lifecycle
    if (productData.status !== undefined) {
      updateFields.status = productData.status;
      if (productData.status === 'published') {
        const { data: current } = await supabase.from('products').select('published_at').eq('id', id).single();
        if (!current?.published_at) {
          updateFields.published_at = new Date().toISOString();
        }
        updateFields.is_active = true;
      } else if (productData.status === 'inactive') {
        updateFields.is_active = false;
      }
    }

    if (productData.is_new_manual !== undefined) {
      updateFields.is_new_manual = productData.is_new_manual === '' || productData.is_new_manual === null ? null : (productData.is_new_manual === 'true' || productData.is_new_manual === true);
    }
    if (productData.new_until !== undefined) {
      updateFields.new_until = productData.new_until || null;
    }

    if (productData.colors !== undefined) {
      updateFields.colors = typeof productData.colors === 'string' ? JSON.parse(productData.colors) : productData.colors;
    }
    if (productData.tags !== undefined) {
      updateFields.tags = typeof productData.tags === 'string' ? JSON.parse(productData.tags) : productData.tags;
    }
    if (productData.attributes_data !== undefined) {
      updateFields.attributes_data = typeof productData.attributes_data === 'string' ? JSON.parse(productData.attributes_data) : productData.attributes_data;
    }

    // Size stock updates
    if (productData.size_stock !== undefined) {
      const size_stock = typeof productData.size_stock === 'string' ? JSON.parse(productData.size_stock) : productData.size_stock;
      updateFields.size_stock = size_stock;
      updateFields.sizes = Object.entries(size_stock).filter(([, qty]) => Number(qty) > 0).map(([s]) => s);
      updateFields.stock = Object.values(size_stock).reduce((a, b) => a + Number(b), 0);
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const url = await uploadToSupabase(file);
        imageUrls.push(url);
      }
      updateFields.images = imageUrls;
    } else if (productData.images !== undefined) {
      updateFields.images = typeof productData.images === 'string' ? JSON.parse(productData.images) : productData.images;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'product.update',
      entityType: 'product',
      entityId: id,
      details: updateFields,
      req
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const duplicateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: original, error: origErr } = await supabase.from('products').select('*').eq('id', id).single();
    if (origErr || !original) {
      return res.status(404).json({ error: 'Original product not found' });
    }

    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const duplicateData = {
      ...original,
      id: undefined,
      name: `${original.name} (Copy)`,
      slug: newSlug,
      sku: `MNS-COPY-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'draft',
      is_active: false,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    delete duplicateData.id;

    const { data: newProd, error } = await supabase.from('products').insert([duplicateData]).select().single();
    if (error) throw error;

    res.status(201).json(newProd);
  } catch (error) {
    next(error);
  }
};

const bulkUpdateProducts = async (req, res, next) => {
  try {
    const { productIds, action, value } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'No products selected' });
    }

    const updates = {};
    if (action === 'status') {
      updates.status = value;
      updates.is_active = value !== 'inactive';
      if (value === 'published') updates.published_at = new Date().toISOString();
    } else if (action === 'category') {
      updates.category_id = value;
    } else if (action === 'delete') {
      updates.is_active = false;
      updates.status = 'archived';
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .in('id', productIds)
      .select();

    if (error) throw error;
    res.json({ message: `Updated ${productIds.length} products`, data });
  } catch (error) {
    next(error);
  }
};

const exportProductsCSV = async (req, res, next) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, sku, base_price, sale_price, stock, status, categories(name)')
      .order('name');

    if (error) throw error;

    const headers = ['ID', 'Name', 'Slug', 'SKU', 'Category', 'Base Price', 'Sale Price', 'Stock', 'Status'];
    const rows = (products || []).map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.slug,
      p.sku || '',
      p.categories?.name || '',
      p.base_price,
      p.sale_price || '',
      p.stock || 0,
      p.status || 'published'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="manseek-products.csv"');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

const importProductsCSV = async (req, res, next) => {
  try {
    let csvData = '';
    if (req.file) {
      csvData = req.file.buffer.toString('utf8');
    } else if (req.body.csv) {
      csvData = req.body.csv;
    } else {
      return res.status(400).json({ error: 'Please upload a CSV file or provide CSV text' });
    }

    const lines = csvData.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or missing data rows' });
    }

    // Fetch existing categories to map names to IDs
    const { data: categories } = await supabase.from('categories').select('id, name, slug');
    const catMap = new Map();
    (categories || []).forEach(c => {
      catMap.set(c.name.toLowerCase(), c.id);
      catMap.set(c.slug.toLowerCase(), c.id);
    });

    const results = { total: lines.length - 1, imported: 0, updated: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      const [id, name, slug, sku, categoryName, basePrice, salePrice, stock, status] = cols;

      if (!name) {
        results.errors.push(`Row ${i}: Product name is missing`);
        continue;
      }

      const category_id = categoryName ? (catMap.get(categoryName.toLowerCase()) || null) : null;
      const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const bPrice = parseFloat(basePrice) || 0;
      const sPrice = salePrice ? parseFloat(salePrice) : null;
      const stockQty = parseInt(stock) || 0;
      const prodStatus = ['draft', 'published', 'inactive', 'archived'].includes(status) ? status : 'published';

      try {
        if (id && id.length > 20) {
          await supabase.from('products').update({
            name,
            slug: productSlug,
            sku: sku || undefined,
            category_id,
            base_price: bPrice,
            sale_price: sPrice,
            stock: stockQty,
            status: prodStatus
          }).eq('id', id);
          results.updated++;
        } else {
          await supabase.from('products').insert([{
            name,
            slug: productSlug,
            sku: sku || `MNS-${Math.floor(1000 + Math.random() * 9000)}`,
            category_id,
            base_price: bPrice,
            sale_price: sPrice,
            stock: stockQty,
            status: prodStatus,
            published_at: prodStatus === 'published' ? new Date().toISOString() : null
          }]);
          results.imported++;
        }
      } catch (rowErr) {
        results.errors.push(`Row ${i} (${name}): ${rowErr.message}`);
      }
    }

    res.json({
      message: `Processed: ${results.imported} created, ${results.updated} updated, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { error } = await supabase.from('products').update({ is_active: false, status: 'archived' }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Product archived successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. INVENTORY MANAGEMENT & STOCK MOVEMENTS
// ==========================================
const getInventory = async (req, res, next) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, sku, stock, low_stock_threshold, size_stock, categories(name)')
      .order('stock', { ascending: true });

    if (error) throw error;

    const lowStockAlerts = await inventoryService.getLowStockAlerts();
    res.json({
      inventory: products || [],
      lowStockAlerts
    });
  } catch (error) {
    next(error);
  }
};

const adjustStockAdmin = async (req, res, next) => {
  try {
    const { productId, variantId, delta, reason, note } = req.body;
    const result = await inventoryService.adjustStock({
      productId,
      variantId,
      delta: parseInt(delta) || 0,
      reason: reason || 'manual_adjustment',
      note,
      userId: req.user.userId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getStockMovements = async (req, res, next) => {
  try {
    const { productId } = req.query;
    let query = supabase
      .from('stock_movements')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. COUPONS & DISCOUNTS
// ==========================================
const getCoupons = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const { code, type, value, min_order_value, max_uses, expires_at, is_active } = req.body;
    const { data, error } = await supabase.from('coupons').insert([{
      code: code.toUpperCase().trim(),
      type: type || 'percentage',
      value: parseFloat(value),
      min_order_value: parseFloat(min_order_value) || 0,
      max_uses: max_uses ? parseInt(max_uses) : null,
      expires_at: expires_at || null,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    }]).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('coupons').update(req.body).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. ORDERS & RETURNS
// ==========================================
const getOrders = async (req, res, next) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, tracking_number } = req.body;
    const updateData = { status: status.toLowerCase() };
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number;

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const getOrderReturns = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('order_returns')
      .select('*, orders(order_number, total), users(name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

const updateOrderReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, refund_amount, admin_notes } = req.body;

    const { data, error } = await supabase
      .from('order_returns')
      .update({
        status,
        refund_amount: refund_amount ? parseFloat(refund_amount) : null,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. CUSTOMERS & ABANDONED CARTS
// ==========================================
const getCustomers = async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at, addresses(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(users || []);
  } catch (error) {
    next(error);
  }
};

const getAbandonedCarts = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .order('last_active', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 10. STORE SETTINGS & AUDIT LOGS
// ==========================================
const getStoreSettings = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('store_settings').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

const updateStoreSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const { data, error } = await supabase
      .from('store_settings')
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 11. MARQUEE TAGS (Preserved)
// ==========================================
const getMarqueeTags = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('marquee_tags')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'P0001' || error.message.includes('relation "marquee_tags" does not exist') || error.code === '42P01') {
        return res.json([
          { id: '1', text: 'NEW ARRIVALS' },
          { id: '2', text: 'FREE SHIPPING ABOVE ₹999' },
          { id: '3', text: 'EXCLUSIVE DROPS' },
          { id: '4', text: 'BUILT IN INDIA' }
        ]);
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const addMarqueeTag = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { data, error } = await supabase
      .from('marquee_tags')
      .insert([{ text }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const deleteMarqueeTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('marquee_tags').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAnalyticsOverview,
  getCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  getSizeGroups,
  createSizeGroup,
  createSize,
  deleteSize,
  getAttributes,
  createAttribute,
  createAttributeOption,
  deleteAttributeOption,
  createProduct,
  updateProduct,
  duplicateProduct,
  bulkUpdateProducts,
  exportProductsCSV,
  importProductsCSV,
  deleteProduct,
  getInventory,
  adjustStockAdmin,
  getStockMovements,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getOrders,
  updateOrderStatus,
  getOrderReturns,
  updateOrderReturnStatus,
  getCustomers,
  getAbandonedCarts,
  getStoreSettings,
  updateStoreSetting,
  getAuditLogs,
  getMarqueeTags,
  addMarqueeTag,
  deleteMarqueeTag
};
