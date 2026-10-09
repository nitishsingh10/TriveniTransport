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
          {/* Solid navy half-circle on right */}
          <div className={styles.heroBg} aria-hidden="true" />
          {/* Decorative circles */}
          <div className={styles.heroAccentCircle} aria-hidden="true" />
          {/* Edge glass strips */}
          <div className={styles.glassLeft} aria-hidden="true" />
          <div className={styles.glassRight} aria-hidden="true" />

          <div className={`container ${styles.heroInner}`}>
            {/* ─ Left: copy */}
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
                Triveni Transports offers transparent, itemised pricing for every move —
                no hidden charges, real-time tracking, and a team that treats your
                belongings like their own.
              </p>
              {/* USP glass pill */}
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <Shield size={26} strokeWidth={2} className={styles.statIcon} />
                  <span className={styles.statLabel}>SAFE</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <Package size={26} strokeWidth={2} className={styles.statIcon} />
                  <span className={styles.statLabel}>RELIABLE</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <Clock size={26} strokeWidth={2} className={styles.statIcon} />
                  <span className={styles.statLabel}>ON TIME</span>
                </div>
              </div>
            </div>

            {/* ─ Right: quote widget */}
            <div className={styles.heroWidget}>
              <InstantEstimate />
            </div>
          </div>
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
                {
                  num: '01', Icon: ClipboardList,
                  title: 'Get a Quote',
                  desc: 'Select your items from our catalog. See transparent, line-by-line pricing instantly.',
                },
                {
                  num: '02', Icon: CreditCard,
                  title: 'Book & Pay',
                  desc: 'Lock your date with a small advance. Full payment only after safe delivery.',
                },
                {
                  num: '03', Icon: Truck,
                  title: 'We Pack & Move',
                  desc: 'Our trained team packs, loads, and transports with care. Track in real-time.',
                },
                {
                  num: '04', Icon: CheckCircle2,
                  title: 'Delivered!',
                  desc: 'Receive at your new location. Download your invoice. Rate the experience.',
                },
              ].map((step) => (
                <div key={step.num} className={styles.stepCard}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <div className={styles.stepIconWrap}>
                    <step.Icon size={30} strokeWidth={1.75} />
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust Stats Bar ───────────────────────────── */}
        <section className={styles.trustBar}>
          <div className={`container ${styles.trustInner}`}>
            {[
              { num: '500+', label: 'Happy Families Moved' },
              { num: '4.9★', label: 'Average Rating' },
              { num: '8+', label: 'Years of Experience' },
              { num: '₹0', label: 'Hidden Charges' },
            ].map((stat, i, arr) => (
              <div key={stat.num} className={styles.trustRow}>
                <div className={styles.trustStat}>
                  <span className={styles.trustNum}>{stat.num}</span>
                  <span className={styles.trustLabel}>{stat.label}</span>
                </div>
                {i < arr.length - 1 && <div className={styles.trustDivider} />}
              </div>
            ))}
          </div>
        </section>

        {/* ── Service Areas ────────────────────────────── */}
        <section className={`section ${styles.areasSection}`}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 className="section-heading">Service Areas</h2>
              <p className="section-subheading" style={{ marginInline: 'auto' }}>
                Core operations across Mumbai &amp; Thane — with long routes to Pune and Gujarat.
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
                <div
                  key={area.name}
                  className={`${styles.areaCard} ${area.type === 'long' ? styles.areaCardLong : ''}`}
                >
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
            <h2 className={styles.ctaTitle}>Ready to Move?</h2>
            <p className={styles.ctaDesc}>
              Get your detailed, itemised quote in under 2 minutes. No surprises, ever.
            </p>
            <a href="/quote" className={styles.ctaBtn}>
              Get Your Free Quote →
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
