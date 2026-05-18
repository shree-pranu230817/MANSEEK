const { z } = require('zod');

const orderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  size: z.string(),
  color: z.string().optional(),
  quantity: z.number().int().min(1)
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  addressId: z.string().uuid("Invalid address ID"),
  couponCode: z.string().optional()
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  order_id: z.string().uuid()
});

module.exports = { createOrderSchema, verifyPaymentSchema };
