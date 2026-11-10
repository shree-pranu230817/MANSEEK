-- ==============================================================================
-- MANSEEK COMPLETE DYNAMIC E-COMMERCE MIGRATION SCRIPT
-- Safe, additive, idempotent, and non-destructive.
-- Preserves all existing tables, rows, relationships, and historical orders.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENHANCE CATEGORIES TABLE (Additive)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS assigned_size_group_id UUID;

-- Ensure baseline categories are visible and have initial configuration
UPDATE categories SET is_visible = TRUE WHERE is_visible IS NULL;
UPDATE categories SET is_featured_home = TRUE WHERE is_featured_home IS NULL;

-- 3. SIZE GROUPS & SIZES TABLES
CREATE TABLE IF NOT EXISTS size_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sizes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  size_group_id UUID NOT NULL REFERENCES size_groups(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(size_group_id, code)
);

CREATE INDEX IF NOT EXISTS idx_sizes_group ON sizes(size_group_id, sort_order);

-- 4. ATTRIBUTES & ATTRIBUTE OPTIONS TABLES
CREATE TABLE IF NOT EXISTS attributes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  code          TEXT UNIQUE NOT NULL,
  type          TEXT DEFAULT 'select' CHECK (type IN ('select', 'color', 'text', 'boolean')),
  is_filterable BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attribute_options (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  value        TEXT NOT NULL,
  meta         JSONB DEFAULT '{}',
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attribute_id, value)
);

CREATE INDEX IF NOT EXISTS idx_attr_options_attr ON attribute_options(attribute_id, sort_order);

-- 5. ENHANCE PRODUCTS TABLE (Additive)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'inactive', 'archived')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS new_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_new_manual BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS size_group_id UUID REFERENCES size_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS attributes_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'MANSEEK',
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS is_featured_collection BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS collection_name TEXT;

-- Backfill published_at for existing products using created_at so existing items don't falsely trigger NEW
UPDATE products
  SET published_at = created_at
  WHERE published_at IS NULL;

UPDATE products
  SET status = 'published'
  WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_status_published ON products(status, published_at);
CREATE INDEX IF NOT EXISTS idx_products_size_group ON products(size_group_id);

-- 6. ENHANCE PRODUCT VARIANTS TABLE (Additive)
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS price_override NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sale_price_override NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS option_matrix JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- 7. STOCK MOVEMENTS & INVENTORY HISTORY TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  delta       INT NOT NULL,
  stock_after INT NOT NULL,
  reason      TEXT NOT NULL CHECK (reason IN ('initial', 'manual_adjustment', 'order_sale', 'order_cancellation', 'return_restock', 'damage')),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  note        TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure historical stock movements survive product deletion even if table already existed
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
    ALTER TABLE stock_movements ALTER COLUMN product_id DROP NOT NULL;
    
    SELECT tc.constraint_name INTO fk_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'stock_movements'
      AND kcu.column_name = 'product_id'
      AND tc.constraint_type = 'FOREIGN KEY';

    IF fk_name IS NOT NULL THEN
      EXECUTE 'ALTER TABLE stock_movements DROP CONSTRAINT ' || quote_ident(fk_name);
      ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, created_at DESC);

-- 8. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO store_settings (key, value, description) VALUES
  ('new_product_duration_days', '30'::jsonb, 'Number of days a newly published product retains the NEW badge automatically'),
  ('low_stock_threshold_default', '5'::jsonb, 'Default threshold for inventory low stock alerts'),
  ('free_shipping_threshold', '999'::jsonb, 'Minimum subtotal in INR for free standard shipping')
ON CONFLICT (key) DO NOTHING;

-- 9. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email  TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  details     JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);

-- 10. ORDER RETURNS & EXCHANGES TABLE
CREATE TABLE IF NOT EXISTS order_returns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  items            JSONB NOT NULL,
  status           TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'refunded', 'completed')),
  reason           TEXT NOT NULL,
  refund_amount    NUMERIC(10,2),
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_returns_order ON order_returns(order_id);

-- 11. ABANDONED CARTS TRACKING TABLE
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  email       TEXT,
  items       JSONB NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL,
  recovered   BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_active ON abandoned_carts(last_active DESC);

-- 12. SEED DEFAULT SIZE GROUPS & ATTRIBUTES
-- Standard Tops Size Group
INSERT INTO size_groups (name, code, description)
VALUES ('Standard Tops', 'tops_standard', 'Standard XS to XXL sizing for tees, hoodies, sweatshirts')
ON CONFLICT (code) DO NOTHING;

-- Waist Pants Size Group
INSERT INTO size_groups (name, code, description)
VALUES ('Waist Sizes', 'pants_waist', 'Waist sizes in inches for pants, joggers, denim')
ON CONFLICT (code) DO NOTHING;

-- One Size / Accessories
INSERT INTO size_groups (name, code, description)
VALUES ('One Size', 'one_size', 'Single size for accessories, caps, bags, and lifestyle gear')
ON CONFLICT (code) DO NOTHING;

-- Link Sizes for Standard Tops
DO $$
DECLARE
  tops_grp_id UUID;
  pants_grp_id UUID;
  onesize_grp_id UUID;
BEGIN
  SELECT id INTO tops_grp_id FROM size_groups WHERE code = 'tops_standard';
  IF tops_grp_id IS NOT NULL THEN
    INSERT INTO sizes (size_group_id, name, code, sort_order) VALUES
      (tops_grp_id, 'Extra Small', 'XS', 1),
      (tops_grp_id, 'Small', 'S', 2),
      (tops_grp_id, 'Medium', 'M', 3),
      (tops_grp_id, 'Large', 'L', 4),
      (tops_grp_id, 'Extra Large', 'XL', 5),
      (tops_grp_id, 'Double Extra Large', 'XXL', 6)
    ON CONFLICT (size_group_id, code) DO NOTHING;
  END IF;

  SELECT id INTO pants_grp_id FROM size_groups WHERE code = 'pants_waist';
  IF pants_grp_id IS NOT NULL THEN
    INSERT INTO sizes (size_group_id, name, code, sort_order) VALUES
      (pants_grp_id, '28 Inch', '28', 1),
      (pants_grp_id, '30 Inch', '30', 2),
      (pants_grp_id, '32 Inch', '32', 3),
      (pants_grp_id, '34 Inch', '34', 4),
      (pants_grp_id, '36 Inch', '36', 5),
      (pants_grp_id, '38 Inch', '38', 6)
    ON CONFLICT (size_group_id, code) DO NOTHING;
  END IF;

  SELECT id INTO onesize_grp_id FROM size_groups WHERE code = 'one_size';
  IF onesize_grp_id IS NOT NULL THEN
    INSERT INTO sizes (size_group_id, name, code, sort_order) VALUES
      (onesize_grp_id, 'One Size Fits All', 'ONESIZE', 1)
    ON CONFLICT (size_group_id, code) DO NOTHING;
  END IF;

  -- Assign default size groups to baseline categories if not already set
  UPDATE categories SET assigned_size_group_id = tops_grp_id WHERE slug IN ('tees', 'hoodies', 'sweatshirts', 'shirts') AND assigned_size_group_id IS NULL;
  UPDATE categories SET assigned_size_group_id = pants_grp_id WHERE slug = 'pants' AND assigned_size_group_id IS NULL;
  UPDATE categories SET assigned_size_group_id = onesize_grp_id WHERE slug = 'accessories' AND assigned_size_group_id IS NULL;
END $$;

-- Core Attributes (Fit, Material)
INSERT INTO attributes (name, code, type, is_filterable) VALUES
  ('Fit', 'fit', 'select', TRUE),
  ('Fabric Weight', 'fabric_weight', 'select', TRUE)
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
  fit_attr_id UUID;
  fabric_attr_id UUID;
BEGIN
  SELECT id INTO fit_attr_id FROM attributes WHERE code = 'fit';
  IF fit_attr_id IS NOT NULL THEN
    INSERT INTO attribute_options (attribute_id, label, value, sort_order) VALUES
      (fit_attr_id, 'Oversized Fit', 'oversized', 1),
      (fit_attr_id, 'Regular Fit', 'regular', 2),
      (fit_attr_id, 'Relaxed Fit', 'relaxed', 3),
      (fit_attr_id, 'Boxy Fit', 'boxy', 4)
    ON CONFLICT (attribute_id, value) DO NOTHING;
  END IF;

  SELECT id INTO fabric_attr_id FROM attributes WHERE code = 'fabric_weight';
  IF fabric_attr_id IS NOT NULL THEN
    INSERT INTO attribute_options (attribute_id, label, value, sort_order) VALUES
      (fabric_attr_id, '240 GSM Cotton', '240_gsm', 1),
      (fabric_attr_id, '280 GSM Heavyweight', '280_gsm', 2),
      (fabric_attr_id, '400 GSM French Terry', '400_gsm', 3)
    ON CONFLICT (attribute_id, value) DO NOTHING;
  END IF;
END $$;

-- 13. ENABLE ROW LEVEL SECURITY AND PERMISSIVE POLICIES (Safely Repeatable)
ALTER TABLE size_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "size_groups_public_read" ON size_groups;
CREATE POLICY "size_groups_public_read" ON size_groups FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "sizes_public_read" ON sizes;
CREATE POLICY "sizes_public_read" ON sizes FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "attributes_public_read" ON attributes;
CREATE POLICY "attributes_public_read" ON attributes FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "attribute_options_public_read" ON attribute_options;
CREATE POLICY "attribute_options_public_read" ON attribute_options FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "store_settings_public_read" ON store_settings;
CREATE POLICY "store_settings_public_read" ON store_settings FOR SELECT TO anon, authenticated USING (TRUE);

-- Completed safely.

