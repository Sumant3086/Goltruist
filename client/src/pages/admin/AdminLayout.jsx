import { Outlet, NavLink } from 'react-router-dom';
import styles from './AdminLayout.module.css';

const links = [
  { to: '/admin', label: 'Analytics', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/draws', label: 'Draws' },
  { to: '/admin/charities', label: 'Charities' },
  { to: '/admin/winners', label: 'Winners' },
];

export default function AdminLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Admin Panel</div>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            {l.label}
          </NavLink>
        ))}
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
