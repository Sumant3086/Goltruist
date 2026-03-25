const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/draws
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM draws WHERE published = true ORDER BY draw_date DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/draws/latest
router.get('/latest', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM draws WHERE published = true ORDER BY draw_date DESC LIMIT 1`
    );
    if (!rows[0]) return res.status(404).json({ error: 'No draws yet' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/draws/:id/my-result
router.get('/:id/my-result', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT de.*, d.numbers, d.draw_date FROM draw_entries de
       JOIN draws d ON d.id = de.draw_id
       WHERE de.draw_id = $1 AND de.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.json({ matched_count: 0 });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
