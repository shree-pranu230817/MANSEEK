const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  size_group_id: z.string().uuid().optional().nullable(),
  base_price: z.coerce.number().min(0).optional().default(0),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  cost_price: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['draft', 'published', 'inactive', 'archived']).optional().default('published'),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string()
  })).optional(),
  tags: z.array(z.string()).optional(),
  attributes_data: z.record(z.any()).optional(),
  is_featured: z.boolean().optional(),
  stock: z.coerce.number().int().min(0).optional().default(0),
  sku: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  low_stock_threshold: z.coerce.number().int().min(0).optional().default(5)
});

module.exports = { productSchema };
