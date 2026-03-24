// Lazy-load Razorpay so missing keys don't crash the server on startup
let _instance = null;

function getRazorpay() {
  if (!_instance) {
    const Razorpay = require('razorpay');
    _instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _instance;
}

module.exports = { getRazorpay };
