import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import styles from './Subscribe.module.css';

export default function Donate() {
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({ charity_id: '', amount: 500 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/charities').then(r => setCharities(r.data)).catch(() => {});
  }, []);

  const handleDonate = async () => {
    if (!form.charity_id) return toast.error('Please select a charity');
    if (form.amount < 100) return toast.error('Minimum donation is ₹100');
    if (!window.Razorpay) return toast.error('Payment gateway not loaded. Please refresh.');

    setLoading(true);
    try {
      const { data } = await api.post('/donations/create-order', form);

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'GolfTrust',
        description: `Donation to ${charities.find(c => c.id === form.charity_id)?.name}`,
        handler: async (response) => {
          await api.post('/donations/verify', { ...response, charity_id: form.charity_id, amount: form.amount });
          toast.success('Thank you for your donation!');
        },
        theme: { color: '#6ee7b7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Donation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: 8 }}>Make a Donation</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40 }}>Support a charity directly — no subscription required.</p>

      <div className="card">
        <div className="form-group">
          <label className="label">Choose a Charity</label>
          <select value={form.charity_id} onChange={e => setForm(p => ({ ...p, charity_id: e.target.value }))}>
            <option value="">Select a charity</option>
            {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Amount (₹)</label>
          <input
            type="number" min="100" step="100"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {[500, 1000, 2000, 5000].map(a => (
            <button key={a} className={`btn btn-secondary`}
              style={{ padding: '6px 16px', fontSize: 13, borderColor: form.amount === a ? 'var(--accent)' : undefined }}
              onClick={() => setForm(p => ({ ...p, amount: a }))}>
              ₹{a.toLocaleString()}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px' }}
          onClick={handleDonate} disabled={loading}>
          {loading ? 'Processing...' : `Donate ₹${form.amount.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
