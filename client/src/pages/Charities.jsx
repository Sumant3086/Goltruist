import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import styles from './Charities.module.css';

const stagger = { show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Charities() {
  const [charities, setCharities] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get(`/charities${search ? `?search=${search}` : ''}`).then(r => setCharities(r.data)).catch(() => {});
  }, [search]);

  return (
    <div className="page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="label">Making a difference</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>Charities</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 36, fontSize: 16 }}>
          Every subscription contributes to these causes. Choose yours.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <input
          placeholder="🔍  Search charities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 380, marginBottom: 40 }}
        />
      </motion.div>

      <motion.div
        className="grid-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {charities.map(c => (
          <motion.div key={c.id} variants={fadeUp}>
            <Link to={`/charities/${c.id}`} className={`card ${styles.card}`}>
              {c.image_url && (
                <div className={styles.imgWrap}>
                  <img src={c.image_url} alt={c.name} className={styles.img}
                onError={e => { e.target.style.display = 'none'; }} />
                  <div className={styles.imgOverlay} />
                </div>
              )}
              <div className={styles.body}>
                {c.featured && <span className="badge badge-green" style={{ marginBottom: 8 }}>⭐ Featured</span>}
                <h3 style={{ marginBottom: 6, fontSize: 16, fontWeight: 700 }}>{c.name}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{c.description?.slice(0, 100)}...</p>
                <div className={styles.arrow}>Learn more →</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {charities.length === 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text2)', textAlign: 'center', padding: '60px 0' }}>
          No charities found.
        </motion.p>
      )}
    </div>
  );
}
