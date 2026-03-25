import { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import styles from './Admin.module.css';

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [mode, setMode] = useState('random');
  const [simResult, setSimResult] = useState(null);
  const [running, setRunning] = useState(false);

  const load = () => api.get('/draws').then(r => setDraws(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const simulate = async () => {
    try {
      const { data } = await api.post('/admin/draws/simulate', { mode });
      setSimResult(data);
    } catch { toast.error('Simulation failed'); }
  };

  const runDraw = async (publish) => {
    setRunning(true);
    try {
      const { data } = await api.post('/admin/draws/run', { mode, publish });
      toast.success(`Draw ${publish ? 'published' : 'created'}! ${data.winners.length} winner(s)`);
      setSimResult(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Draw failed');
    } finally { setRunning(false); }
  };

  const publish = async (id) => {
    try {
      await api.patch(`/admin/draws/${id}/publish`);
      toast.success('Published');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Draw Management</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Run a Draw</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <label className="label" style={{ margin: 0 }}>Mode:</label>
          <select value={mode} onChange={e => setMode(e.target.value)} style={{ width: 'auto' }}>
            <option value="random">Random</option>
            <option value="weighted">Weighted (by score frequency)</option>
          </select>
        </div>

        {simResult && (
          <div style={{ marginBottom: 16, padding: 16, background: 'var(--surface2)', borderRadius: 8 }}>
            <p style={{ marginBottom: 8, fontSize: 13, color: 'var(--muted)' }}>Simulation result:</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {simResult.numbers.map(n => (
                <span key={n} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#0a0a0f', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={simulate}>Simulate</button>
          <button className="btn btn-secondary" onClick={() => runDraw(false)} disabled={running}>Save (unpublished)</button>
          <button className="btn btn-primary" onClick={() => runDraw(true)} disabled={running}>
            {running ? 'Running...' : 'Run & Publish'}
          </button>
        </div>
      </div>

      <h3 style={{ marginBottom: 16 }}>Draw History</h3>
      <table className={styles.table}>
        <thead>
          <tr><th>Date</th><th>Numbers</th><th>Pool</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {draws.map(d => (
            <tr key={d.id}>
              <td>{new Date(d.draw_date).toLocaleDateString()}</td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  {d.numbers.map(n => (
                    <span key={n} style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>{n}</span>
                  ))}
                </div>
              </td>
              <td>₹{Number(d.prize_pool).toLocaleString()}</td>
              <td><span className={`badge ${d.published ? 'badge-green' : 'badge-gray'}`}>{d.published ? 'Published' : 'Draft'}</span></td>
              <td>
                {!d.published && (
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => publish(d.id)}>Publish</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
