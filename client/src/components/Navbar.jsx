import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  // Only show avatar initial if user is actually logged in and has a name
  const avatarLetter = user?.name ? user.name[0].toUpperCase() : null;

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>
        <div className={styles.logoIcon}>⛳</div>
        <span>GolfTrust</span>
      </Link>

      {/* Desktop links */}
      <div className={styles.links}>
        <Link to="/charities" className={`${styles.link} ${location.pathname === '/charities' ? styles.active : ''}`}>Charities</Link>

        {user ? (
          <>
            <Link to="/dashboard" className={`${styles.link} ${location.pathname === '/dashboard' ? styles.active : ''}`}>Dashboard</Link>
            <Link to="/donate" className={`${styles.link} ${location.pathname === '/donate' ? styles.active : ''}`}>Donate</Link>
            {user.role === 'admin' && (
              <Link to="/admin" className={`${styles.link} ${location.pathname.startsWith('/admin') ? styles.active : ''}`}>Admin</Link>
            )}

            {/* Avatar with click-based dropdown */}
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.avatar}
                onClick={() => setDropdownOpen(p => !p)}
                aria-label="User menu"
              >
                {avatarLetter}
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropName}>{user.name}</div>
                  <div className={styles.dropDivider} />
                  <Link to="/profile" className={styles.dropItem} onClick={() => setDropdownOpen(false)}>
                    ⚙ Settings
                  </Link>
                  <button onClick={handleLogout} className={styles.dropItem}>
                    ↩ Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.link}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px' }}>Get Started</Link>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className={styles.hamburger} onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
        <span className={menuOpen ? styles.barOpen1 : styles.bar} />
        <span className={menuOpen ? styles.barOpen2 : styles.bar} />
        <span className={menuOpen ? styles.barOpen3 : styles.bar} />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/charities" className={styles.mobileLink}>Charities</Link>
          {user ? (
            <>
              <Link to="/dashboard" className={styles.mobileLink}>Dashboard</Link>
              <Link to="/donate" className={styles.mobileLink}>Donate</Link>
              <Link to="/profile" className={styles.mobileLink}>Settings</Link>
              {user.role === 'admin' && <Link to="/admin" className={styles.mobileLink}>Admin</Link>}
              <button onClick={handleLogout} className={styles.mobileLink} style={{ textAlign: 'left', background: 'none', color: 'var(--danger)' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.mobileLink}>Login</Link>
              <Link to="/register" className={styles.mobileLink} style={{ color: 'var(--accent)' }}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
