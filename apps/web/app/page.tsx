import {
  Shield,
  Package,
  Clock,
  ClipboardList,
  CreditCard,
  Truck,
  CheckCircle2,
  MapPin,
  Trophy,
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstantEstimate from './components/InstantEstimate';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ──────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroText}>
              <span className={styles.heroBadge}>
                <Trophy size={14} />
                Mumbai &amp; Thane's Most Trusted Movers
              </span>
              <h1 className={styles.heroTitle}>
                Move Smarter.<br />
                <span className={styles.heroAccent}>Pay Fairly.</span>
              </h1>
              <p className={styles.heroDesc}>
                Triveni Transports offers transparent, itemized pricing for every move.
                No hidden charges. Real-time tracking. Done right.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <Shield size={28} strokeWidth={2} className={styles.statIcon} />
                  <span className={styles.statLabel}>SAFE</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <Package size={28} strokeWidth={2} className={styles.statIcon} />
                  <span className={styles.statLabel}>RELIABLE</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <Clock size={28} strokeWidth={2} className={styles.statIcon} />
                  <span className={styles.statLabel}>ON TIME</span>
                </div>
              </div>
            </div>
            <div className={styles.heroWidget}>
              <InstantEstimate />
            </div>
          </div>
          {/* glassmorphism edge panels */}
          <div className={styles.glassLeft} />
          <div className={styles.glassRight} />
        </section>

        {/* ── How It Works ─────────────────────────────── */}
        <section className={`section ${styles.howSection}`}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 className="section-heading">How It Works</h2>
              <p className="section-subheading" style={{ marginInline: 'auto' }}>
                Four simple steps from estimate to doorstep delivery
              </p>
            </div>
            <div className={styles.steps}>
              {[
                { num: '01', Icon: ClipboardList, title: 'Get a Quote', desc: 'Select your items from our catalog. See transparent, line-by-line pricing instantly.' },
                { num: '02', Icon: CreditCard, title: 'Book & Pay', desc: 'Lock your date with a small advance. Full payment only after safe delivery.' },
                { num: '03', Icon: Truck, title: 'We Pack & Move', desc: 'Our trained team packs, loads, and transports with care. Track in real-time.' },
                { num: '04', Icon: CheckCircle2, title: 'Delivered!', desc: 'Receive at your new location. Download your invoice. Rate the experience.' },
              ].map((step, i) => (
                <div key={step.num} className={`${styles.stepCard} animate-in animate-in-delay-${i + 1}`}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <div className={styles.stepIconWrap}>
                    <step.Icon size={32} strokeWidth={1.75} />
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Service Areas ────────────────────────────── */}
        <section className={`section ${styles.areasSection}`}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 className="section-heading">Service Areas</h2>
              <p className="section-subheading" style={{ marginInline: 'auto' }}>
                Core operations in Mumbai &amp; Thane. Long routes to Pune and Gujarat.
              </p>
            </div>
            <div className={styles.areaGrid}>
              {[
                { name: 'Thane', tag: 'Core Zone', type: 'core' },
                { name: 'Mumbai South', tag: 'Core Zone', type: 'core' },
                { name: 'Western Suburbs', tag: 'Core Zone', type: 'core' },
                { name: 'Eastern Suburbs', tag: 'Core Zone', type: 'core' },
                { name: 'Pune', tag: 'Long Route', type: 'long' },
                { name: 'Gujarat', tag: 'Long Route', type: 'long' },
              ].map((area) => (
                <div key={area.name} className={`${styles.areaCard} ${area.type === 'long' ? styles.areaCardLong : ''}`}>
                  <MapPin size={18} strokeWidth={2} className={styles.areaIcon} />
                  <span className={styles.areaName}>{area.name}</span>
                  <span className={`${styles.areaTag} ${area.type === 'long' ? styles.areaTagLong : ''}`}>
                    {area.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaGlass}>
            <div className="container" style={{ textAlign: 'center' }}>
              <h2 className={styles.ctaTitle}>Ready to Move?</h2>
              <p className={styles.ctaDesc}>
                Get your detailed, itemized quote in under 2 minutes. No surprises.
              </p>
              <a href="/quote" className={`btn btn-accent btn-lg ${styles.ctaBtn}`} style={{ marginTop: 'var(--space-6)' }}>
                Get Your Free Quote →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
