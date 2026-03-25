import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import styles from './Subscribe.module.css';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '₹999', period: '/month', desc: 'Billed monthly. Cancel anytime.' },
  { id: 'yearly',  label: 'Yearly',  price: '₹8,999', period: '/year', desc: 'Save ~25% vs monthly. Best value.' },
];

export default function Subscribe() {
  const [selected, setSelected] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/subscriptions/create-order', { plan: selected });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'GolfTrust',
        description: `${selected} subscription`,
        handler: async (response) => {
          await api.post('/subscriptions/verify', { ...response, plan: selected });
          toast.success('Subscription activated!');
          navigate('/dashboard');
        },
        theme: { color: '#6ee7b7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 style={{ marginBottom: 8 }}>Choose your plan</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40 }}>10% of every subscription goes directly to your chosen charity.</p>

      <div className={styles.plans}>
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`${styles.plan} ${selected === plan.id ? styles.selected : ''}`}
            onClick={() => setSelected(plan.id)}
          >
            {plan.id === 'yearly' && <span className={styles.badge}>Best Value</span>}
            <h3>{plan.label}</h3>
            <div className={styles.price}>{plan.price}<span>{plan.period}</span></div>
            <p>{plan.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.features}>
        {['Monthly draw entry', 'Score tracking (5 rolling)', 'Charity contribution', 'Winner verification', 'Full dashboard access'].map(f => (
          <div key={f} className={styles.feature}>
            <span style={{ color: 'var(--accent)' }}>✓</span> {f}
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ fontSize: 16, padding: '14px 40px' }} onClick={handleSubscribe} disabled={loading}>
        {loading ? 'Processing...' : `Subscribe — ${PLANS.find(p => p.id === selected).price}`}
      </button>
    </div>
  );
}
