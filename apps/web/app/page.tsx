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
                🏆 Mumbai & Thane's Most Trusted Movers
              </span>
              <h1 className={styles.heroTitle}>
                Move Smarter.<br />
                <span className={styles.heroGradient}>Pay Fairly.</span>
              </h1>
              <p className={styles.heroDesc}>
                Triveni Transports offers transparent, itemized pricing for every move.
                No hidden charges. Real-time tracking. Done right.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <span className={styles.statNum}>2000+</span>
                  <span className={styles.statLabel}>Moves Completed</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNum}>4.8★</span>
                  <span className={styles.statLabel}>Customer Rating</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNum}>0%</span>
                  <span className={styles.statLabel}>Hidden Charges</span>
                </div>
              </div>
            </div>
            <div className={styles.heroWidget}>
              <InstantEstimate />
            </div>
          </div>
          <div className={styles.heroBg} />
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
                { num: '01', icon: '📋', title: 'Get a Quote', desc: 'Select your items from our catalog. See transparent, line-by-line pricing instantly.' },
                { num: '02', icon: '💳', title: 'Book & Pay', desc: 'Lock your date with a small advance. Full payment only after safe delivery.' },
                { num: '03', icon: '📦', title: 'We Pack & Move', desc: 'Our trained team packs, loads, and transports with care. Track in real-time.' },
                { num: '04', icon: '✅', title: 'Delivered!', desc: 'Receive at your new location. Download your invoice. Rate the experience.' },
              ].map((step, i) => (
                <div key={step.num} className={`${styles.stepCard} animate-in animate-in-delay-${i + 1}`}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <span className={styles.stepIcon}>{step.icon}</span>
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
                Core operations in Mumbai & Thane. Long routes to Pune and Gujarat.
              </p>
            </div>
            <div className={styles.areaGrid}>
              {[
                { name: 'Thane', tag: 'Core Zone', color: 'var(--brand-600)' },
                { name: 'Mumbai South', tag: 'Core Zone', color: 'var(--brand-600)' },
                { name: 'Western Suburbs', tag: 'Core Zone', color: 'var(--brand-600)' },
                { name: 'Eastern Suburbs', tag: 'Core Zone', color: 'var(--brand-600)' },
                { name: 'Pune', tag: 'Long Route', color: 'var(--accent-500)' },
                { name: 'Gujarat', tag: 'Long Route', color: 'var(--accent-500)' },
              ].map((area) => (
                <div key={area.name} className={styles.areaCard}>
                  <span className={styles.areaName}>{area.name}</span>
                  <span className={styles.areaTag} style={{ background: area.color }}>
                    {area.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <section className={styles.ctaSection}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 className={styles.ctaTitle}>Ready to Move?</h2>
            <p className={styles.ctaDesc}>
              Get your detailed, itemized quote in under 2 minutes. No surprises.
            </p>
            <a href="/quote" className="btn btn-accent btn-lg" style={{ marginTop: 'var(--space-6)' }}>
              Get Your Free Quote →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
