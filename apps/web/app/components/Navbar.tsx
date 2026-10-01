'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <img src="/logo.png" alt="Triveni Transports Logo" className={styles.logoImage} />
          <div className={styles.logoTextWrapper}>
            <span className={styles.logoTitle}>TRIVENI</span>
            <span className={styles.logoSubtitle}>— TRANSPORTS —</span>
            <span className={styles.logoTagline}>SAFE HANDS FOR YOUR SHIFTING PLANS</span>
          </div>
        </Link>

        <ul className={`${styles.navLinks} ${mobileOpen ? styles.open : ''}`}>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/quote">Get Quote</Link></li>
          <li><Link href="/bookings">My Bookings</Link></li>
          <li><Link href="/trust">Why Us</Link></li>
        </ul>

        <div className={styles.actions}>
          <Link href="/login" className="btn btn-primary btn-sm">
            Login
          </Link>
          <button
            className={styles.burger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
