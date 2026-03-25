import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import styles from './Home.module.css';

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.12 } } };

export default function Home() {
  const [charities, setCharities] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/charities?featured=true').then(r => setCharities(r.data)).catch(() => {});
    api.get('/draws/latest').then(r => setLatestDraw(r.data)).catch(() => {});
    api.get('/admin/analytics').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        {/* Background orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />

        <div className={styles.heroInner}>
          <motion.div
            className={styles.heroContent}
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.span variants={fadeUp} className={styles.pill}>
              <span className={styles.pillDot} />
              Play. Give. Win.
            </motion.span>

            <motion.h1 variants={fadeUp} className={styles.heroTitle}>
              Golf that<br />
              <span className="glow-text">changes lives</span>
            </motion.h1>

            <motion.p variants={fadeUp} className={styles.heroSub}>
              Subscribe, enter your Stableford scores, and compete in monthly draws —
              while supporting the charities that matter to you.
            </motion.p>

            <motion.div variants={fadeUp} className={styles.heroCta}>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
                Start Playing →
              </Link>
              <Link to="/charities" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 36px' }}>
                Explore Charities
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className={styles.statsCard}>
              {[
                { label: 'Monthly Jackpot', value: '₹40,000+', color: 'var(--accent)' },
                { label: 'Charity Impact', value: '10% per sub', color: 'var(--accent2)' },
                { label: 'Draw Types', value: '3 / 4 / 5 Match', color: 'var(--accent3)' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  className={styles.statItem}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <span className={styles.statLabel}>{s.label}</span>
                  <strong style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</strong>
                </motion.div>
              ))}
            </div>

            {/* Floating draw balls */}
            <div className={styles.floatingBalls}>
              {[12, 27, 8, 35, 19].map((n, i) => (
                <motion.div
                  key={n}
                  className="draw-ball"
                  style={{ animationDelay: `${i * 0.4}s` }}
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
                >
                  {n}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.section}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.sectionLabel}>Simple process</div>
          <h2 className={styles.sectionTitle}>How it works</h2>
        </motion.div>

        <motion.div
          className="grid-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {[
            { icon: '💳', step: '01', title: 'Subscribe', desc: 'Pick monthly or yearly. A portion goes straight to your chosen charity every month.' },
            { icon: '⛳', step: '02', title: 'Enter Scores', desc: 'Log your last 5 Stableford scores. They become your personal draw numbers.' },
            { icon: '🏆', step: '03', title: 'Win & Give', desc: 'Match 3, 4, or 5 numbers in the monthly draw. Jackpot rolls over if unclaimed.' },
          ].map(item => (
            <motion.div key={item.title} variants={fadeUp} className={`card gradient-border ${styles.howCard}`}>
              <div className={styles.stepNum}>{item.step}</div>
              <div className={styles.howIcon}>{item.icon}</div>
              <h3 style={{ marginBottom: 8, fontSize: 18 }}>{item.title}</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Prize Pool ── */}
      <section className={styles.prizeSection}>
        <div className={styles.prizeInner}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.sectionLabel}>Prize distribution</div>
            <h2 className={styles.sectionTitle}>How prizes are split</h2>
          </motion.div>
          <motion.div
            className="grid-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {[
              { match: '5 Numbers', pct: '40%', label: 'Jackpot', rollover: true, color: 'var(--accent)' },
              { match: '4 Numbers', pct: '35%', label: 'Major Prize', rollover: false, color: 'var(--accent2)' },
              { match: '3 Numbers', pct: '25%', label: 'Prize', rollover: false, color: 'var(--accent3)' },
            ].map(p => (
              <motion.div key={p.match} variants={fadeUp} className={`card ${styles.prizeCard}`} style={{ borderColor: `${p.color}30` }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: p.color, marginBottom: 4 }}>{p.pct}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.match}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13 }}>{p.label}</div>
                {p.rollover && (
                  <span className="badge badge-green" style={{ marginTop: 12 }}>🔄 Jackpot Rollover</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Charities ── */}
      {charities.length > 0 && (
        <section className={styles.section}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.sectionLabel}>Making a difference</div>
            <h2 className={styles.sectionTitle}>Featured Charities</h2>
          </motion.div>

          <motion.div
            className="grid-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {charities.map(c => (
              <motion.div key={c.id} variants={fadeUp}>
                <Link to={`/charities/${c.id}`} className={`card card-hover ${styles.charityCard}`}>
                  {c.image_url && (
                    <div className={styles.charityImgWrap}>
                      <img src={c.image_url} alt={c.name} className={styles.charityImg}
                        onError={e => { e.target.style.display = 'none'; }} />
                      <div className={styles.charityImgOverlay} />
                    </div>
                  )}
                  <span className="badge badge-green" style={{ marginBottom: 10 }}>Featured</span>
                  <h3 style={{ marginBottom: 6, fontSize: 16 }}>{c.name}</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{c.description?.slice(0, 90)}...</p>
                  <div className={styles.charityArrow}>View charity →</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/charities" className="btn btn-secondary" style={{ padding: '12px 32px' }}>View All Charities</Link>
          </div>
        </section>
      )}

      {/* ── Latest Draw ── */}
      {latestDraw && (
        <section className={styles.section}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.sectionLabel}>Most recent</div>
            <h2 className={styles.sectionTitle}>Latest Draw</h2>
          </motion.div>
          <motion.div
            className={`card ${styles.drawCard}`}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
              {new Date(latestDraw.draw_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className={styles.drawBalls}>
              {latestDraw.numbers.map((n, i) => (
                <motion.div
                  key={n}
                  className="draw-ball"
                  style={{ width: 60, height: 60, fontSize: 20 }}
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                >
                  {n}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaOrb} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.ctaTitle}>Ready to make your<br />game count?</h2>
          <p className={styles.ctaSub}>Join golfers making a difference every month.</p>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: 17, padding: '16px 48px', marginTop: 32 }}>
            Subscribe Now →
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
