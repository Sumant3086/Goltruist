const router = require('express').Router();
const db = require('../config/db');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/winners/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*, d.draw_date, d.numbers
       FROM winners w
       LEFT JOIN draws d ON d.id = w.draw_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/winners/:id/upload-proof
router.post('/:id/upload-proof', authenticate, upload.single('proof'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileName = `proofs/${req.user.id}/${req.params.id}_${Date.now()}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(fileName);

    const { rows } = await db.query(
      `UPDATE winners SET proof_url = $1, verification_status = 'pending'
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [publicUrl, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Winner record not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
