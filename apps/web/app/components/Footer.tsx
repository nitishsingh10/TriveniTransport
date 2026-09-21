import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>🚚 Triveni<span className={styles.accent}>Transports</span></span>
          <p className={styles.tagline}>
            Trusted packers & movers in Mumbai, Thane and beyond.
            Transparent pricing. Real-time tracking. Zero hassle.
          </p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <h4>Services</h4>
            <ul>
              <li><Link href="/quote">Get a Quote</Link></li>
              <li><Link href="/trust">Why Choose Us</Link></li>
              <li><Link href="/bookings">Track Booking</Link></li>
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Service Areas</h4>
            <ul>
              <li>Thane</li>
              <li>Mumbai South</li>
              <li>Western Suburbs</li>
              <li>Eastern Suburbs</li>
              <li>Pune (Long Route)</li>
              <li>Gujarat (Long Route)</li>
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Contact</h4>
            <ul>
              <li>📞 +91 99999 99999</li>
              <li>📧 info@trivenitransports.com</li>
              <li>📍 Thane, Maharashtra</li>
            </ul>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className="container">
          <p>© {new Date().getFullYear()} Triveni Transports. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
