import { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import styles from './Admin.module.css';

const STATUS_BADGE = { pending: 'badge-gray', approved: 'badge-green', rejected: 'badge-red', paid: 'badge-blue', unpaid: 'badge-gray' };

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);

  const load = () => api.get('/admin/winners').then(r => setWinners(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const verify = async (id, status) => {
    try {
      await api.patch(`/admin/winners/${id}/verify`, { status });
      toast.success(`Winner ${status}`);
      load();
    } catch { toast.error('Failed'); }
  };

  const payout = async (id) => {
    try {
      await api.patch(`/admin/winners/${id}/payout`);
      toast.success('Marked as paid');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Winners ({winners.length})</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr><th>User</th><th>Draw</th><th>Match</th><th>Prize</th><th>Verification</th><th>Payment</th><th>Proof</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {winners.map(w => (
              <tr key={w.id}>
                <td>
                  <div>{w.users?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{w.users?.email}</div>
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>{w.draws ? new Date(w.draws.draw_date).toLocaleDateString() : '—'}</td>
                <td><span className="badge badge-blue">{w.match_type.replace('_', ' ')}</span></td>
                <td style={{ fontWeight: 600 }}>₹{Number(w.prize_amount).toLocaleString()}</td>
                <td><span className={`badge ${STATUS_BADGE[w.verification_status]}`}>{w.verification_status}</span></td>
                <td><span className={`badge ${STATUS_BADGE[w.payment_status]}`}>{w.payment_status}</span></td>
                <td>
                  {w.proof_url ? (
                    <a href={w.proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13 }}>View</a>
                  ) : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {w.verification_status === 'pending' && (
                      <>
                        <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => verify(w.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => verify(w.id, 'rejected')}>Reject</button>
                      </>
                    )}
                    {w.payment_status === 'pending' && (
                      <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => payout(w.id)}>Mark Paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
