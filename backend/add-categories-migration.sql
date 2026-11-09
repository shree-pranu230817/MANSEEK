-- ====================================================================
-- MANSEEK Migration: Add Pants, Shirts, and Accessories Categories
-- Safe, minimal, repeatable, and idempotent.
-- Preserves all existing categories, products, and relationships.
-- Does NOT overwrite existing custom image URLs.
-- ====================================================================

-- 1. Ensure existing categories maintain baseline sort orders
UPDATE categories SET sort_order = 1 WHERE slug = 'tees';
UPDATE categories SET sort_order = 2 WHERE slug = 'hoodies';
UPDATE categories SET sort_order = 3 WHERE slug = 'sweatshirts';

-- 2. Insert or update new categories safely without overwriting existing images
INSERT INTO categories (name, slug, sort_order, image_url)
VALUES
  ('Pants', 'pants', 4, '/images/cat-pants.jpg'),
  ('Shirts', 'shirts', 5, '/images/cat-tees.jpg'),
  ('Accessories', 'accessories', 6, '/images/cat-acc.jpg')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  image_url = COALESCE(categories.image_url, EXCLUDED.image_url);
