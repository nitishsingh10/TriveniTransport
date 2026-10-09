'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, PhoneCall } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <img src="/logo.png" alt="Triveni Transports Logo" className={styles.logoImage} />
            <div className={styles.logoTextWrapper}>
              <span className={styles.logoTitle}>TRIVENI</span>
              <span className={styles.logoSubtitle}>— TRANSPORTS —</span>
              <span className={styles.logoTagline}>SAFE HANDS FOR YOUR SHIFTING PLANS</span>
            </div>
          </Link>

          <ul className={`${styles.navLinks} ${mobileOpen ? styles.open : ''}`}>
            <li>
              <Link href="/" onClick={closeMenu}>Home</Link>
            </li>
            <li>
              <Link href="/quote" onClick={closeMenu}>Get Quote</Link>
            </li>
            <li>
              <Link href="/vendor/signup" onClick={closeMenu}>Work with Us</Link>
            </li>
            <li>
              <Link href="/login" onClick={closeMenu} className={styles.mobileOnlyLink}>
                Customer Login
              </Link>
            </li>
            <li className={styles.mobileActions}>
              <Link href="/quote" className={`btn btn-accent ${styles.mobileCta}`} onClick={closeMenu}>
                Get Instant Quote <ArrowRight size={16} />
              </Link>
              <div className={styles.mobileSupport}>
                <PhoneCall size={14} className={styles.mobileSupportIcon} />
                <span>Call 24/7: <strong>8828647785</strong></span>
              </div>
            </li>
          </ul>

          <div className={styles.actions}>
            <Link href="/login" className={`btn btn-primary btn-sm ${styles.desktopLogin}`}>
              Login
            </Link>
            <button
              className={`${styles.burger} ${mobileOpen ? styles.burgerOpen : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
