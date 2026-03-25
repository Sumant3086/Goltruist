const router = require('express').Router();
const db = require('../config/db');
const { getRazorpay } = require('../config/razorpay');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

// POST /api/donations/create-order
router.post('/create-order', authenticate, async (req, res) => {
  const { amount, charity_id } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum donation is ₹100' });
  if (!charity_id) return res.status(400).json({ error: 'Charity required' });

  try {
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `don_${Date.now()}`,
    });
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/donations/verify
router.post('/verify', authenticate, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, charity_id, amount } = req.body;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature)
    return res.status(400).json({ error: 'Payment verification failed' });

  try {
    await db.query(
      `INSERT INTO donations (user_id, charity_id, amount, razorpay_order_id, razorpay_payment_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, charity_id, amount, razorpay_order_id, razorpay_payment_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
