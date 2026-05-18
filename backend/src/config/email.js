require('dotenv').config();
const { Resend } = require('resend');

let resendInstance = null;

if (process.env.RESEND_API_KEY) {
  resendInstance = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('Missing Resend API key in environment variables');
}

module.exports = resendInstance;
