import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ScoreEntry from '../components/ScoreEntry';
import WinningsPanel from '../components/WinningsPanel';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [profile, setProfile] = useState(null);
  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
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

  useEffect(() => { load(); }, []);

  const cancelSub = async () => {
    if (!c? You will retain access until the expiry date.')) return;
    try {
      await api.post('/subscriptions/cancel');
      toast.success('Subscription cancelled');
      load();
    } catch { toast.error('Failed to cancel'); }
  };

  if (loading) return <div className="page" style={{ color: 'var(--muted)' }}>Loading...</div>;

  const isActive = sub?.active;
  const totalWon = winners.reduce((s, w) => s + Number(w.prize_amount), 0);
  const paidOut = winners.filter(w => w.payment_status === , w) => s + Number(w.prize_amount), 0);

  return (
    <div className="page">
      <div className={styles.header}>
        <div>
          <h1>Welcome, {user?.name}</h1>
          <p style={{ color: 'var(--muted)' }}>Your golf dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/profile" className="btn btn-secondary">Settings</Link>
          {!isActive && <Link to="/subscribe" className="btn btn-primary">Activate Subscription</Link>}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Subscription Card */}
        <div className="card">
          <div className="label">Subscription</div>
          {isActive ? (
            <>
              <span className="badge badge-green">Active</span>
              { marginTop: 12, fontSize: 14, color: 'var(--muted)' }}>
                Plan: <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{sub.subscription?.plan}</strong>
              </p>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                Renews: <strong style={{ color: 'var(--text)' }}>
                  {new Date(sub.subscription?.expires_at).toLocaleDateString()}
                </strong>
              </p>
              <button onClick={cancelSub} style={{ marginTop: 12, fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Cancel subscription
              </button>
            </>
          ) : (
            <>
              <span className={`badge ${sub?.subscription?.status === 'cancelled' ? 'badge-gray' : 'badge-red'}`}>
                {sub?.subscription?.status || 'Inactive'}
              </span>
            ws</p>
            </>
          )}
        </div>

        {/* Charity Card */}
        <div className="card">
          <div className="label">Your Charity</div>
          {profile?.charity_id ? (
            <p style={{ fontWeight: 600 }}>{profile?.charity_name || 'Selected'}</p>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No charity selected</p>
          )}
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
            Contribution: <strong style={{ color: 'var(--accent)' }}>{profile?.charity_percentage || 10}%</strong>
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Link to="/profile" style={{ fontSize: 13, color: 'var(--accent)' }}>Change →</Link>
            <Link to="/donate" style={{ fontSize: 13, color: 'var(--accent2)' }}>Donate directly →</Link>
          </div>
        </div>
      </div>

      {/* Winnings Summary */}
      {winners.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="label">Total Won</div>
            <div stylep: 8 }}>
              ₹{totalWon.toLocaleString()}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{winners.length} prize(s)</p>
          </div>
ngs Detail */}
      <WinningsPanel />
    </div>
  );
}
pan style={{ color: 'var(--muted)' }}>{new Date(d.draw_date).toLocaleDateString()}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {d.numbers.map(n => (
                      <span key={n} style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Winni yet. Keep your scores updated!</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, marginBottom: 12 }}>
              Entered in {draws.length} draw(s) · Next draw: monthly
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {draws.slice(0, 3).map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <s           ₹{(totalWon - paidOut).toLocaleString()} pending
            </p>
          </div>
        </div>
      )}

      {/* Score Entry */}
      <div style={{ marginBottom: 24 }}>
        <ScoreEntry disabled={!isActive} />
      </div>

      {/* Draw Participation */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="label">Draw Participation</div>
        {draws.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>No draws published          <div className="card">
            <div className="label">Paid Out</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent2)', marginTop: 8 }}>
              ₹{paidOut.toLocaleString()}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
   