import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ScoreEntry from '../components/ScoreEntry';
import WinningsPanel from '../components/WinningsPanel';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function Dashboard() {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [profile, setProfile] = useState(null);
  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/subscriptions/status'),
      api.get('/users/me'),
      api.get('/draws'),
      api.get('/winners/me'),
    ]).then(([s, p, d, w]) => {
      setSub(s.data);
      setProfile(p.data);
      setDraws(d.data);
      setWinners(w.data);
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cancelSub = async () => {
    if (!confirm('Cancel your subscription? You will retain access until the expiry date.')) return;
    try {
      await api.post('/subscriptions/cancel');
      toast.success('Subscription cancelled');
      load();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⛳</div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isActive = sub?.active;
  const totalWon = winners.reduce((acc, w) => acc + Number(w.prize_amount), 0);
  const paidOut = winners
    .filter(w => w.payment_status === 'paid')
    .reduce((acc, w) => acc + Number(w.prize_amount), 0);

  return (
    <div className="page">
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>Your GolfTrust dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/profile" className="btn btn-secondary">⚙ Settings</Link>
          {!isActive && (
            <Link to="/subscribe" className="btn btn-primary">Activate Subscription</Link>
          )}
        </div>
      </motion.div>

      {/* Top cards */}
      <motion.div
        className="grid-2"
        style={{ marginBottom: 24 }}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Subscription Card */}
        <motion.div variants={fadeUp} className="card">
          <div className="label">Subscription</div>
          {isActive ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <span className="badge badge-green">● Active</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>
                  {sub.subscription?.plan} plan
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 12 }}>
                Renews:{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {new Date(sub.subscription?.expires_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </strong>
              </p>
              <button
                onClick={cancelSub}
                style={{
                  marginTop: 14, fontSize: 12, color: 'var(--danger)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                Cancel subscription
              </button>
            </>
          ) : (
            <>
              <div style={{ marginTop: 10 }}>
                <span className={`badge ${sub?.subscription?.status === 'cancelled' ? 'badge-gray' : 'badge-red'}`}>
                  {sub?.subscription?.status === 'cancelled' ? 'Cancelled' : 'Inactive'}
                </span>
              </div>
              <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text2)' }}>
                Subscribe to enter monthly draws
              </p>
              <Link to="/subscribe" className="btn btn-primary" style={{ marginTop: 14, fontSize: 13, padding: '8px 18px' }}>
                Subscribe Now
              </Link>
            </>
          )}
        </motion.div>

        {/* Charity Card */}
        <motion.div variants={fadeUp} className="card">
          <div className="label">Your Charity</div>
          {profile?.charity_id ? (
            <p style={{ fontWeight: 700, fontSize: 16, marginTop: 10 }}>
              {profile?.charity_name || 'Charity Selected'}
            </p>
          ) : (
            <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 10 }}>
              No charity selected yet
            </p>
          )}
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8 }}>
            Contribution:{' '}
            <strong style={{ color: 'var(--accent)', fontSize: 16 }}>
              {profile?.charity_percentage || 10}%
            </strong>
            {' '}of subscription
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <Link to="/profile" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              Change charity →
            </Link>
            <Link to="/donate" style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>
              Donate directly →
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Winnings Summary — only shown if user has won */}
      {winners.length > 0 && (
        <motion.div
          className="grid-2"
          style={{ marginBottom: 24 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card">
            <div className="label">Total Won</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--accent)', marginTop: 8, letterSpacing: -1 }}>
              ₹{totalWon.toLocaleString()}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              {winners.length} prize{winners.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="card">
            <div className="label">Paid Out</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--accent2)', marginTop: 8, letterSpacing: -1 }}>
              ₹{paidOut.toLocaleString()}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              ₹{(totalWon - paidOut).toLocaleString()} pending
            </p>
          </div>
        </motion.div>
      )}

      {/* Score Entry */}
      <motion.div
        style={{ marginBottom: 24 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ScoreEntry disabled={!isActive} />
      </motion.div>

      {/* Draw Participation */}
      <motion.div
        className="card"
        style={{ marginBottom: 24 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="label">Draw Participation</div>
          {draws.length > 0 && (
            <span className="badge badge-blue">{draws.length} draw{draws.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {draws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
            No draws published yet. Keep your scores updated!
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Next draw runs monthly · Make sure your scores are up to date
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {draws.slice(0, 3).map(d => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: 14,
                    padding: '10px 14px', background: 'var(--surface2)',
                    borderRadius: 10,
                  }}
                >
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>
                    {new Date(d.draw_date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(d.numbers || []).map(n => (
                      <span
                        key={n}
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                          color: '#07070f', fontWeight: 800, fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Winnings Detail */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <WinningsPanel />
      </motion.div>
    </div>
  );
}
