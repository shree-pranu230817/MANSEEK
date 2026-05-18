const resend = require('../config/email');

const sendOrderConfirmation = async ({ to, name, orderNumber, items, total, address }) => {
  if (!resend) return console.log('Email mocked: Order Confirmation to', to);
  
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'orders@manseek.in',
    to,
    subject: `Order Confirmed! #${orderNumber} 🎉`,
    html: `<p>Hi ${name},</p><p>Your order ${orderNumber} for ₹${total} is confirmed.</p>`
  });
};

const sendStatusUpdate = async ({ to, name, orderNumber, status, trackingNumber }) => {
  if (!resend) return console.log('Email mocked: Status Update to', to);
  
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'orders@manseek.in',
    to,
    subject: `Your order is now ${status}! 📦`,
    html: `<p>Hi ${name},</p><p>Your order ${orderNumber} is ${status}. ${trackingNumber ? 'Tracking: ' + trackingNumber : ''}</p>`
  });
};

const sendWelcomeEmail = async ({ to, name }) => {
  if (!resend) return console.log('Email mocked: Welcome to', to);
  
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'hello@manseek.in',
    to,
    subject: "Welcome to ManSeek 🔥",
    html: `<p>Hi ${name}, welcome to ManSeek!</p>`
  });
};

module.exports = { sendOrderConfirmation, sendStatusUpdate, sendWelcomeEmail };
