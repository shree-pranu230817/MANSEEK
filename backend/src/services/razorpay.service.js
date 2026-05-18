const razorpay = require('../config/razorpay');
const crypto = require('crypto');

const createRazorpayOrder = async (amount, receiptId) => {
  if (!razorpay) throw new Error("Razorpay not configured");
  
  return await razorpay.orders.create({
    amount: Math.round(amount * 100), // amount in paise
    currency: 'INR',
    receipt: receiptId,
    payment_capture: 1,
  });
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
    
  return expected === signature;
};

module.exports = { createRazorpayOrder, verifyPaymentSignature };
