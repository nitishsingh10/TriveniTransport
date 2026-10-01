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
            <ul className={styles.contactList}>
              <li>
                <Phone size={14} className={styles.contactIcon} />
                <span>8828647785, 8652521009</span>
              </li>
              <li>
                <Mail size={14} className={styles.contactIcon} />
                <span>info@trivenitransports.com</span>
              </li>
              <li>
                <MapPin size={14} className={styles.contactIcon} />
                <span>Shop No.4, HNO.372, Durganagar, near New Parshwanagh college, GB road, Thane west.</span>
              </li>
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
