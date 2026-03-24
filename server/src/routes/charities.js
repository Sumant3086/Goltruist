const router = require('express').Router();
const db = require('../config/db');

// GET /api/charities
router.get('/', async (req, res) => {
  const { search, featured } = req.query;
  try {
    let query = `SELECT * FROM charities WHERE active = true`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    if (featured === 'true') {
      query += ` AND featured = true`;
    }
    query += ` ORDER BY name`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/charities/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM charities WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
