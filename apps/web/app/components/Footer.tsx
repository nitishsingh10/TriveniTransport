import Link from 'next/link';
import { Phone, MapPin } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logoWrapper}>
            <img src="/logo-white.png" alt="Triveni Transports Logo" className={styles.logoImage} />
            <div className={styles.logoTextWrapper}>
              <span className={styles.logoTitle}>TRIVENI</span>
              <div className={styles.logoSubtitleRow}>
                <span className={styles.subDash} aria-hidden="true" />
                <span className={styles.logoSubtitle}>TRANSPORTS</span>
                <span className={styles.subDash} aria-hidden="true" />
              </div>
              <span className={styles.tagline}>SAFE HANDS FOR YOUR SHIFTING PLANS</span>
            </div>
          </div>

          <div className={styles.businessCardContact}>
            <a href="tel:8828647785" className={styles.contactItem} title="Call 8828647785">
              <div className={styles.iconCircle}>
                <Phone size={16} fill="currentColor" />
              </div>
              <div className={styles.contactDivider} />
              <span className={styles.contactText}>8828647785</span>
            </a>

            <a href="tel:8652521009" className={styles.contactItem} title="Call 8652521009">
              <div className={styles.iconCircle}>
                <Phone size={16} fill="currentColor" />
              </div>
              <div className={styles.contactDivider} />
              <span className={styles.contactText}>8652521009</span>
            </a>

            <div className={styles.contactItem}>
              <div className={styles.iconCircle}>
                <MapPin size={16} fill="currentColor" />
              </div>
              <div className={styles.contactDivider} />
              <span className={styles.contactText}>
                Shop No.4, HNO.372, Durganagar, near New Parshwanath college, GB road, Thane West, Maharashtra 400601.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <h4>Services</h4>
            <ul>
              <li><Link href="/quote">Get an Instant Quote</Link></li>
              <li><Link href="/services">Relocation Services</Link></li>
              <li><Link href="/trust">Why Choose Us</Link></li>
              <li><Link href="/#faqs">Relocation FAQs</Link></li>
              <li><Link href="/vendor/signup">Work with Us (Captains)</Link></li>
              <li><Link href="/login">Customer Login</Link></li>
              <li><Link href="/vendor/login">Partner Portal</Link></li>
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Service Areas</h4>
            <ul>
              <li><Link href="/packers-and-movers-thane">Packers &amp; Movers Thane</Link></li>
              <li><Link href="/packers-and-movers-mumbai">Packers &amp; Movers Mumbai</Link></li>
              <li><Link href="/packers-and-movers-mumbai">Western &amp; Eastern Suburbs</Link></li>
              <li><Link href="/packers-and-movers-mumbai">South Mumbai Relocation</Link></li>
              <li><Link href="/quote?destination=Pune">Mumbai to Pune Express</Link></li>
              <li><Link href="/quote?destination=Gujarat">Gujarat Long Route</Link></li>
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Legal &amp; Trust</h4>
            <ul>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/trust">₹5L Transit Insurance</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p>© {new Date().getFullYear()} Triveni Transports. All rights reserved. Thane, Mumbai, Maharashtra.</p>
        </div>
      </div>
    </footer>
  );
}
