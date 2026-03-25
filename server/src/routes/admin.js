const router = require('express').Router();
const db = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');
const { generateDrawNumbers, matchScores, calculateTiers } = require('../utils/drawEngine');

router.use(authenticate, isAdmin);

// ── Users ──────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              s.status AS sub_status, s.plan, s.expires_at
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  const { name, role, charity_id } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        charity_id = COALESCE($3, charity_id)
       WHERE id = $4 RETURNING id, name, email, role`,
      [name, role, charity_id, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/scores/:scoreId', async (req, res) => {
  const { score, played_at } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE scores SET score = COALESCE($1, score), played_at = COALESCE($2, played_at)
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [score, played_at, req.params.scoreId, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id/scores
router.get('/users/:id/scores', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM scores WHERE user_id = $1 ORDER BY played_at DESC`, [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/subscriptions/:userId — cancel or reactivate
router.patch('/subscriptions/:userId', async (req, res) => {
  const { status } = req.body; // 'active' | 'cancelled' | 'lapsed'
  try {
    const { rows } = await db.query(
      `UPDATE subscriptions SET status = $1 WHERE user_id = $2 RETURNING *`,
      [status, req.params.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No subscription found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Charities ──────────────────────────────────────────
router.post('/charities', async (req, res) => {
  const { name, description, image_url, featured } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO charities (name, description, image_url, featured, active)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [name, description, image_url, featured || false]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/charities/:id', async (req, res) => {
  const { name, description, image_url, featured, active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE charities SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        image_url = COALESCE($3, image_url),
        featured = COALESCE($4, featured),
        active = COALESCE($5, active)
       WHERE id = $6 RETURNING *`,
      [name, description, image_url, featured, active, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/charities/:id', async (req, res) => {
  try {
    await db.query(`UPDATE charities SET active = false WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Draws ──────────────────────────────────────────────
router.post('/draws/simulate', async (req, res) => {
  const { mode = 'random' } = req.body;
  try {
    const numbers = await generateDrawNumbers(mode);
    res.json({ numbers, mode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/draws/run', async (req, res) => {
  const { mode = 'random', publish = false } = req.body;

  try {
    const numbers = await generateDrawNumbers(mode);

    // Active subscribers
    const { rows: subscribers } = await db.query(
      `SELECT user_id FROM subscriptions WHERE status = 'active' AND expires_at > NOW()`
    );

    // Prize pool from this month's contributions
    const { rows: contribs } = await db.query(
      `SELECT COALESCE(SUM(prize_pool_amount), 0) AS total
       FROM contributions WHERE created_at >= date_trunc('month', NOW())`
    );
    const totalPool = parseFloat(contribs[0].total);

    // Get jackpot carryover
    const { rows: jackpotRows } = await db.query(`SELECT carryover FROM jackpot WHERE id = 1`);
    const jackpot_carryover = parseFloat(jackpotRows[0]?.carryover || 0);

    const tiers = calculateTiers(totalPool, jackpot_carryover);

    // Create draw
    const { rows: drawRows } = await db.query(
      `INSERT INTO draws (numbers, mode, published, draw_date, prize_pool, tiers)
       VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING *`,
      [numbers, mode, publish, totalPool, JSON.stringify(tiers)]
    );
    const draw = drawRows[0];

    const entries = [];
    const winners = [];

    for (const sub of subscribers) {
      const { rows: scoreRows } = await db.query(
        `SELECT score FROM scores WHERE user_id = $1`, [sub.user_id]
      );
      const userScores = scoreRows.map(s => s.score);
      const matched = matchScores(userScores, numbers);

      entries.push(`('${draw.id}', '${sub.user_id}', ARRAY[${userScores.join(',')||'NULL'}], ${matched})`);

      if (matched >= 3) {
        winners.push({ user_id: sub.user_id, match_type: `${matched}_match`, scores: userScores });
      }
    }

    // Bulk insert entries
    if (entries.length) {
      await db.query(
        `INSERT INTO draw_entries (draw_id, user_id, scores_snapshot, matched_count) VALUES ${entries.join(',')}
         ON CONFLICT (draw_id, user_id) DO NOTHING`
      );
    }

    // Calculate prize per winner per tier
    const tierCount = { '5_match': 0, '4_match': 0, '3_match': 0 };
    winners.forEach(w => { if (tierCount[w.match_type] !== undefined) tierCount[w.match_type]++; });

    const tierKey = { '5_match': 'five_match', '4_match': 'four_match', '3_match': 'three_match' };

    for (const w of winners) {
      const prize = tierCount[w.match_type] > 0
        ? (tiers[tierKey[w.match_type]] || 0) / tierCount[w.match_type]
        : 0;
      await db.query(
        `INSERT INTO winners (draw_id, user_id, match_type, prize_amount)
         VALUES ($1, $2, $3, $4)`,
        [draw.id, w.user_id, w.match_type, prize]
      );
    }

    res.json({
      draw,
      total_entries: entries.length,
      winners_count: winners.length,
      jackpot_rolled_over: tierCount['5_match'] === 0,
      next_jackpot: tierCount['5_match'] === 0 ? tiers.five_match : 0,
    });

    // Update jackpot carryover in DB
    const newCarryover = tierCount['5_match'] === 0 ? tiers.five_match : 0;
    await db.query(`UPDATE jackpot SET carryover = $1, updated_at = NOW() WHERE id = 1`, [newCarryover]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/draws/:id/publish', async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE draws SET published = true WHERE id = $1 RETURNING *`, [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All draws (including unpublished) for admin
router.get('/draws', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM draws ORDER BY draw_date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Winners ────────────────────────────────────────────
router.get('/winners', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*, u.name AS user_name, u.email AS user_email,
              d.draw_date, d.numbers
       FROM winners w
       JOIN users u ON u.id = w.user_id
       JOIN draws d ON d.id = w.draw_id
       ORDER BY w.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/winners/:id/verify', async (req, res) => {
  const { status } = req.body;
  try {
    const payment = status === 'approved' ? 'pending' : 'rejected';
    const { rows } = await db.query(
      `UPDATE winners SET verification_status = $1, payment_status = $2
       WHERE id = $3 RETURNING *`,
      [status, payment, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/winners/:id/payout', async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE winners SET payment_status = 'paid' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Analytics ──────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const [users, subs, contribs, draws] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM users`),
      db.query(`SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND expires_at > NOW()`),
      db.query(`SELECT COALESCE(SUM(charity_amount),0) AS charity, COALESCE(SUM(prize_pool_amount),0) AS prize FROM contributions`),
      db.query(`SELECT COUNT(*) FROM draws`),
    ]);

    res.json({
      total_users: parseInt(users.rows[0].count),
      active_subscribers: parseInt(subs.rows[0].count),
      total_charity_contributed: parseFloat(contribs.rows[0].charity),
      total_prize_pool: parseFloat(contribs.rows[0].prize),
      total_draws: parseInt(draws.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
