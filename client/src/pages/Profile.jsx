import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Profile() {
  const [form, setForm] = useState({ name: '', charity_id: '', charity_percentage: 10 });
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/users/me'), api.get('/charities')]).then(([u, c]) => {
      const user = u.data;
      setForm({ name: user.name, charity_id: user.charity_id || '', charity_percentage: user.charity_percentage || 10 });
      setCharities(c.data);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.charity_percentage < 10 || form.charity_percentage > 100)
      return toast.error('Charity % must be between 10 and 100');
    setLoading(true);
    try {
      await api.patch('/users/me', form);
      toast.success('Profile updated');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: 500 }}>
        <h2>Profile Settings</h2>
        <p className={styles.sub}>Update your name, charity, and contribution</p>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Charity</label>
            <select value={form.charity_id} onChange={e => setForm(p => ({ ...p, charity_id: e.target.value }))}>
              <option value="">Select a charity</option>
              {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Charity Contribution % (min 10%)</label>
            <input
              type="number" min="10" max="100"
              value={form.charity_percentage}
              onChange={e => setForm(p => ({ ...p, charity_percentage: Number(e.target.value) }))}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
