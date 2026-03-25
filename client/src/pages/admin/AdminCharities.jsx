import { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import styles from './Admin.module.css';

const empty = { name: '', description: '', image_url: '', featured: false };

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/charities').then(r => setCharities(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/admin/charities/${editing}`, form);
        toast.success('Updated');
      } else {
        await api.post('/admin/charities', form);
        toast.success('Created');
      }
      setForm(empty); setEditing(null); load();
    } catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Deactivate this charity?')) return;
    try { await api.delete(`/admin/charities/${id}`); toast.success('Deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  const startEdit = (c) => { setEditing(c.id); setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '', featured: c.featured }); };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Charities</h2>

      <div className="card" style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 16 }}>{editing ? 'Edit Charity' : 'Add Charity'}</h3>
        <form onSubmit={save}>
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Image URL</label>
              <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 16 }}>
            <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} style={{ width: 'auto' }} />
            Featured charity
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
            {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <table className={styles.table}>
        <thead><tr><th>Name</th><th>Featured</th><th>Actions</th></tr></thead>
        <tbody>
          {charities.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.featured ? <span className="badge badge-green">Yes</span> : '—'}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => startEdit(c)}>Edit</button>
                <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => del(c.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
