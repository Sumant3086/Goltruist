const router = require('express').Router();
const db = require('../config/db');
const { getRazorpay } = require('../config/razorpay');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

const PLANS = {
  monthly: { amount: 99900, months: 1 },  // ₹999
  yearly:  { amount: 899900, months: 12 }, // ₹8999
};

// POST /api/subscriptions/create-order
router.post('/create-order', authenticate, async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  try {
    const order = await getRazorpay().orders.create({
      amount: PLANS[plan].amount,
      currency: 'INR',
      receipt: `gt_${Date.now()}`,
    });
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/verify
router.post('/verify', authenticate, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature)
    return res.status(400).json({ error: 'Payment verification failed' });

  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + PLANS[plan].months);

  try {
    // Upsert subscription
    const { rows } = await db.query(
      `INSERT INTO subscriptions (user_id, plan, status, razorpay_order_id, razorpay_payment_id, started_at, expires_at)
       VALUES ($1, $2, 'active', $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         plan = EXCLUDED.plan, status = 'active',
         razorpay_order_id = EXCLUDED.razorpay_order_id,
         razorpay_payment_id = EXCLUDED.razorpay_payment_id,
         started_at = EXCLUDED.started_at,
         expires_at = EXCLUDED.expires_at
       RETURNING *`,
      [req.user.id, plan, razorpay_order_id, razorpay_payment_id, now, expires]
    );

    const sub = rows[0];
    const total = PLANS[plan].amount / 100;

    // Log contribution
    await db.query(
      `INSERT INTO contributions (user_id, subscription_id, charity_amount, prize_pool_amount, total_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, sub.id, total * 0.10, total * 0.40, total]
    );

    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/status
router.get('/status', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM subscriptions WHERE user_id = $1`, [req.user.id]
    );
    if (!rows[0]) return res.json({ active: false });
    const active = rows[0].status === 'active' && new Date(rows[0].expires_at) > new Date();
    res.json({ active, subscription: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/cancel
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 RETURNING *`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No subscription found' });
    res.json({ success: true, subscription: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
