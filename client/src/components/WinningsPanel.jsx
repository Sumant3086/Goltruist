import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import styles from './WinningsPanel.module.css';

const STATUS_BADGE = {
  pending: 'badge-gray',
  approved: 'badge-green',
  rejected: 'badge-red',
  paid: 'badge-blue',
  unpaid: 'badge-gray',
};

export default function WinningsPanel() {
  const [winners, setWinners] = useState([]);
  const fileRefs = useRef({});

  useEffect(() => {
    api.get('/winners/me').then(r => setWinners(r.data)).catch(() => {});
  }, []);

  const uploadProof = async (id) => {
    const file = fileRefs.current[id]?.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('proof', file);
    try {
      await api.post(`/winners/${id}/upload-proof`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Proof uploaded');
      api.get('/winners/me').then(r => setWinners(r.data));
    } catch {
      toast.error('Upload failed');
    }
  };

  if (winners.length === 0) return (
    <div className="card">
      <div className="label">Winnings</div>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>No winnings yet. Keep playing!</p>
    </div>
  );

  return (
    <div className="card">
      <div className="label">Winnings</div>
      <div className={styles.list}>
        {winners.map(w => (
          <div key={w.id} className={styles.row}>
            <div>
              <p style={{ fontWeight: 600 }}>{w.match_type.replace('_', ' ')} — ₹{Number(w.prize_amount).toLocaleString()}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                Draw: {w.draws ? new Date(w.draws.draw_date).toLocaleDateString() : '—'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge ${STATUS_BADGE[w.verification_status]}`}>{w.verification_status}</span>
              <span className={`badge ${STATUS_BADGE[w.payment_status]}`}>{w.payment_status}</span>
              {w.verification_status === 'pending' && !w.proof_url && (
                <div>
                  <input type="file" accept="image/*" ref={el => fileRefs.current[w.id] = el} style={{ display: 'none' }} onChange={() => uploadProof(w.id)} />
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px' }}
                    onClick={() => fileRefs.current[w.id]?.click()}>
                    Upload Proof
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
