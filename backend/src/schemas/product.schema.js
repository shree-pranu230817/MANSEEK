const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  category_id: z.string().uuid("Invalid category ID"),
  base_price: z.number().min(0),
  sale_price: z.number().min(0).optional().nullable(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string()
  })).optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  stock: z.number().int().min(0).optional()
});

module.exports = { productSchema };
