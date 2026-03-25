import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import toast from 'react-hot-toast';
import styles from './ScoreEntry.module.css';

export default function ScoreEntry({ disabled }) {
  const [scores, setScores] = useState([]);
  const [form, setForm] = useState({ score: '', played_at: '' });
  const [loading, setLoading] = useState(false);

  const fetchScores = () => {
    api.get('/scores').then(r => setScores(r.data)).catch(() => {});
  };

  useEffect(() => { fetchScores(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (disabled) return toast.error('Active subscription required');
    setLoading(true);
    try {
      await api.post('/scores', { score: Number(form.score), played_at: form.played_at });
      toast.success('Score added');
      setForm({ score: '', played_at: '' });
      fetchScores();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="label">My Scores</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Last 5 Stableford scores · newest first</p>
        </div>
        <span className="badge badge-blue">{scores.length} / 5</span>
      </div>

      <AnimatePresence>
        {scores.length > 0 ? (
          <div className={styles.scoreList}>
            {scores.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
              >
                <ScoreRow score={s} onSave={() => fetchScores()} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: 'var(--text2)', fontSize: 14, margin: '12px 0 20px', padding: '20px', background: 'var(--surface2)', borderRadius: 10, textAlign: 'center' }}
          >
            No scores yet. Add your first score below.
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div className="label">Score (1–45)</div>
          <input
            type="number" min="1" max="45" placeholder="e.g. 32"
            value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))}
            required disabled={disabled}
          />
        </div>
        <div style={{ flex: 1.5, minWidth: 140 }}>
          <div className="label">Date Played</div>
          <input
            type="date" value={form.played_at}
            onChange={e => setForm(p => ({ ...p, played_at: e.target.value }))}
            required disabled={disabled}
          />
        </div>
        <div style={{ paddingTop: 22 }}>
          <button type="submit" className="btn btn-primary" disabled={loading || disabled} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '...' : '+ Add Score'}
          </button>
        </div>
      </form>

      {disabled && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
          Subscribe to start entering scores
        </p>
      )}
    </div>
  );
}

function ScoreRow({ score, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(score.score);
  const [date, setDate] = useState(score.played_at?.split('T')[0]);

  const save = async () => {
    try {
      await api.patch(`/scores/${score.id}`, { score: Number(val), played_at: date });
      toast.success('Score updated');
      onSave();
      setEditing(false);
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className={styles.scoreRow}>
      {editing ? (
        <div className={styles.editRow}>
          <input type="number" min="1" max="45" value={val} onChange={e => setVal(e.target.value)} style={{ width: 80 }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 150 }} />
          <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={save}>Save</button>
          <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className={styles.viewRow}>
          <div className={styles.scoreBall}>{score.score}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{score.score} pts</div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(score.played_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
          <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12, marginLeft: 'auto' }} onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
}
