import { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import styles from './Admin.module.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [scores, setScores] = useState({});

  const load = () => api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateRole = async (id, role) => {
    try { await api.patch(`/admin/users/${id}`, { role }); toast.success('Role updated'); load(); }
    catch { toast.error('Failed'); }
  };

  const updateSubStatus = async (userId, status) => {
    try { await api.patch(`/admin/subscriptions/${userId}`, { status }); toast.success('Subscription updated'); load(); }
    catch { toast.error('Failed'); }
  };

  const toggleScores = async (userId) => {
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    if (!scores[userId]) {
      const { data } = await api.get(`/admin/users/${userId}/scores`);
      setScores(p => ({ ...p, [userId]: data }));
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Users ({users.length})</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Subscription</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <>
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span></td>
                  <td>
                    {u.sub_status ? (
                      <span className={`badge ${u.sub_status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {u.sub_status} · {u.plan}
                      </span>
                    ) : <span className="badge badge-gray">none</span>}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => toggleScores(u.id)}>
                        {expanded === u.id ? 'Hide' : 'Scores'}
                      </button>
                      {u.role !== 'admin'
                        ? <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => updateRole(u.id, 'admin')}>Make Admin</button>
                        : <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => updateRole(u.id, 'subscriber')}>Revoke Admin</button>
                      }
                      {u.sub_status === 'active' && (
                        <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => updateSubStatus(u.id, 'cancelled')}>Cancel Sub</button>
                      )}
                      {u.sub_status === 'cancelled' && (
                        <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => updateSubStatus(u.id, 'active')}>Reactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded === u.id && (
                  <tr key={`${u.id}-scores`}>
                    <td colSpan={6} style={{ background: 'var(--surface2)', padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Golf Scores</div>
                      {scores[u.id]?.length ? (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {scores[u.id].map(s => (
                            <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                              <strong style={{ color: 'var(--accent)', fontSize: 18 }}>{s.score}</strong>
                              <div style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(s.played_at).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      ) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>No scores yet</p>}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
