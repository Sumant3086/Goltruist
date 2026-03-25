import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import styles from './Admin.module.css';

const stagger = { show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return (
    <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>Loading analytics...</div>
  );

  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: '👥', color: 'var(--accent2)' },
    { label: 'Active Subscribers', value: stats.active_subscribers, icon: '✅', color: 'var(--accent)' },
    { label: 'Charity Contributed', value: `₹${Number(stats.total_charity_contributed).toLocaleString()}`, icon: '❤️', color: 'var(--accent3)' },
    { label: 'Total Prize Pool', value: `₹${Number(stats.total_prize_pool).toLocaleString()}`, icon: '🏆', color: '#fbbf24' },
    { label: 'Draws Run', value: stats.total_draws, icon: '🎯', color: 'var(--accent2)' },
  ];

  return (
    <div>
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 28 }}>
        Analytics
      </motion.h2>

      <motion.div
        className={styles.statsGrid}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {cards.map(c => (
          <motion.div key={c.label} variants={fadeUp} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 28, opacity: 0.3 }}>{c.icon}</div>
            <div className="label">{c.label}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: c.color, marginTop: 10, letterSpacing: -1 }}>
              {c.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid-2" style={{ marginTop: 8 }}>
        <div className="card">
          <div className="label" style={{ marginBottom: 16 }}>Prize Pool Distribution</div>
          {[
            { label: '5-Number Match (Jackpot)', pct: 40, color: 'var(--accent)' },
            { label: '4-Number Match', pct: 35, color: 'var(--accent2)' },
            { label: '3-Number Match', pct: 25, color: 'var(--accent3)' },
          ].map(t => (
            <div key={t.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>{t.label}</span>
                <span style={{ fontWeight: 700, color: t.color }}>{t.pct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: t.color, borderRadius: 3 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${t.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="label" style={{ marginBottom: 16 }}>Subscription Split</div>
          {[
            { label: 'Charity Contribution', pct: 10, color: 'var(--accent3)' },
            { label: 'Prize Pool', pct: 40, color: 'var(--accent)' },
            { label: 'Platform', pct: 50, color: 'var(--muted)' },
          ].map(t => (
            <div key={t.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>{t.label}</span>
                <span style={{ fontWeight: 700, color: t.color }}>{t.pct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: t.color, borderRadius: 3 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${t.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
