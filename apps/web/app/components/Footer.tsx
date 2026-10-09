import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logoWrapper}>
            <img src="/logo.png" alt="Triveni Transports Logo" className={styles.logoImage} />
            <div className={styles.logoTextWrapper}>
              <span className={styles.logoTitle}>TRIVENI</span>
              <span className={styles.logoSubtitle}>— TRANSPORTS —</span>
            </div>
          </div>
          <p className={styles.tagline}>
            SAFE HANDS FOR YOUR SHIFTING PLANS
          </p>

          <div className={styles.businessCardContact}>
            <div className={styles.contactItem}>
              <div className={styles.iconCircle}>
                <Phone size={16} fill="currentColor" />
              </div>
              <div className={styles.contactDivider} />
              <span className={styles.contactText}>8828647785</span>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.iconCircle}>
                <Phone size={16} fill="currentColor" />
              </div>
              <div className={styles.contactDivider} />
              <span className={styles.contactText}>8652521009</span>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.iconCircle}>
                <MapPin size={16} fill="currentColor" />
              </div>
              <div className={styles.contactDivider} />
              <span className={styles.contactText}>
                Shop No.4, HNO.372, Durganagar, near New Parshwanagh college, GB road, Thane west.
              </span>
            </div>
          </div>
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
            <h4>Legal</h4>
            <ul>
              <li><Link href="/terms">Terms & Conditions</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
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
