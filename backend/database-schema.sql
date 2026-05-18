-- Run these in the Supabase SQL editor in order.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,          -- store bcrypt hash, NOT plaintext
  role          TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Table: addresses
CREATE TABLE addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT DEFAULT 'Home',       -- Home / Work / Other
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: categories
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  image_url   TEXT,
  description TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('T-Shirts', 'tshirts', 1),
  ('Hoodies', 'hoodies', 2),
  ('Joggers', 'joggers', 3),
  ('Accessories', 'accessories', 4),
  ('Custom', 'custom', 5);

-- Table: products
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  category_id   UUID REFERENCES categories(id),
  base_price    NUMERIC(10,2) NOT NULL,
  sale_price    NUMERIC(10,2),             -- NULL if not on sale
  images        TEXT[] DEFAULT '{}',       -- array of image URLs (Supabase Storage)
  sizes         TEXT[] DEFAULT '{}',       -- ['XS','S','M','L','XL','XXL']
  colors        JSONB DEFAULT '[]',        -- [{ name: "Black", hex: "#000" }]
  tags          TEXT[] DEFAULT '{}',
  is_featured   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  stock         INT DEFAULT 0,
  rating        NUMERIC(3,2) DEFAULT 0,
  review_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;

-- Table: product_variants
CREATE TABLE product_variants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  size        TEXT NOT NULL,
  color       TEXT,
  stock       INT DEFAULT 0,
  sku         TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: orders
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number          TEXT UNIQUE NOT NULL,   -- e.g. MNS-20240001
  user_id               UUID REFERENCES users(id),
  guest_email           TEXT,                    -- for guest checkout
  items                 JSONB NOT NULL,          -- snapshot of cart items
  address               JSONB NOT NULL,          -- shipping address snapshot
  subtotal              NUMERIC(10,2) NOT NULL,
  shipping_charge       NUMERIC(10,2) DEFAULT 0,
  discount              NUMERIC(10,2) DEFAULT 0,
  total                 NUMERIC(10,2) NOT NULL,
  coupon_code           TEXT,
  status                TEXT DEFAULT 'pending'
                        CHECK (status IN (
                          'pending','confirmed','processing',
                          'shipped','out_for_delivery','delivered','cancelled','refunded'
                        )),
  payment_status        TEXT DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid','paid','failed','refunded')),
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  tracking_number       TEXT,
  estimated_delivery    DATE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Table: reviews
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: wishlists
CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Table: coupons
CREATE TABLE coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  type            TEXT CHECK (type IN ('percentage', 'flat')),
  value           NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses        INT,
  used_count      INT DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Table: newsletter_subscribers
CREATE TABLE newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  subscribed  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Order number sequence
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'MNS-' || TO_CHAR(NOW(), 'YYYY') || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_order
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own row
CREATE POLICY "users_own_row" ON users
  FOR ALL USING (auth.uid() = id);

-- Users can only see their own orders
CREATE POLICY "orders_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Products and categories are public
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = TRUE);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public" ON categories
  FOR SELECT TO anon, authenticated USING (TRUE);
