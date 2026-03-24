const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.charity_id, u.charity_percentage, u.created_at,
              c.name AS charity_name,
              s.status AS sub_status, s.plan, s.expires_at
       FROM users u
       LEFT JOIN charities c ON c.id = u.charity_id
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res) => {
  const { name, charity_id, charity_percentage } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET name = COALESCE($1, name), charity_id = COALESCE($2, charity_id),
       charity_percentage = COALESCE($3, charity_percentage) WHERE id = $4 RETURNING id, name, email, charity_id, charity_percentage`,
      [name, charity_id, charity_percentage, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
