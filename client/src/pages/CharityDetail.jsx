import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function CharityDetail() {
  const { id } = useParams();
  const [charity, setCharity] = useState(null);

  useEffect(() => {
    api.get(`/charities/${id}`).then(r => setCharity(r.data)).catch(() => {});
  }, [id]);

  if (!charity) return <div className="page" style={{ color: 'var(--muted)' }}>Loading...</div>;

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      {charity.image_url && (
        <img src={charity.image_url} alt={charity.name} style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 12, marginBottom: 28 }} />
      )}
      {charity.featured && <span className="badge badge-green" style={{ marginBottom: 12 }}>Featured Charity</span>}
      <h1 style={{ marginBottom: 12 }}>{charity.name}</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{charity.description}</p>
      <div style={{ marginTop: 32 }}>
        <Link to="/register" className="btn btn-primary">Support this charity</Link>
      </div>
    </div>
  );
}
