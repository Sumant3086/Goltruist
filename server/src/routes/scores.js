const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/scores
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM scores WHERE user_id = $1 ORDER BY played_at DESC LIMIT 5`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scores
router.post('/', authenticate, async (req, res) => {
  const { score, played_at } = req.body;
  if (!score || score < 1 || score > 45)
    return res.status(400).json({ error: 'Score must be between 1 and 45' });

  // Require active subscription
  const { rows: subRows } = await db.query(
    `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()`,
    [req.user.id]
  );
  if (!subRows[0]) return res.status(403).json({ error: 'Active subscription required to add scores' });

  try {
    // Count existing scores
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM scores WHERE user_id = $1`, [req.user.id]
    );

    // If already 5, delete the oldest
    if (parseInt(countRows[0].count) >= 5) {
      await db.query(
        `DELETE FROM scores WHERE id = (
          SELECT id FROM scores WHERE user_id = $1 ORDER BY played_at ASC LIMIT 1
        )`,
        [req.user.id]
      );
    }

    const { rows } = await db.query(
      `INSERT INTO scores (user_id, score, played_at) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, score, played_at || new Date()]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/scores/:id
router.patch('/:id', authenticate, async (req, res) => {
  const { score, played_at } = req.body;
  if (score && (score < 1 || score > 45))
    return res.status(400).json({ error: 'Score must be between 1 and 45' });

  try {
    const { rows } = await db.query(
      `UPDATE scores SET
        score = COALESCE($1, score),
        played_at = COALESCE($2, played_at)
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [score, played_at, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Score not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
