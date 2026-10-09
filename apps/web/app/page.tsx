'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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
  ArrowRight,
  Smartphone,
  Star,
  ArrowDown,
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstantEstimate from './components/InstantEstimate';
import styles from './page.module.css';

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    const elements = document.querySelectorAll(`.${styles.revealItem}`);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ──────────────────────────────────────── */}
        <section className={styles.hero}>
          {/* Solid navy half-circle on right (desktop) */}
          <div className={styles.heroBg} aria-hidden="true" />
          {/* Ambient dynamic glowing background orbs */}
          <div className={styles.heroGlow1} aria-hidden="true" />
          <div className={styles.heroGlow2} aria-hidden="true" />
          {/* Decorative circles */}
          <div className={styles.heroAccentCircle} aria-hidden="true" />
          {/* Edge glass strips */}
          <div className={styles.glassLeft} aria-hidden="true" />
          <div className={styles.glassRight} aria-hidden="true" />

          <div className={`container ${styles.heroInner}`}>
            {/* ─ Left: copy + Download App ─ */}
            <div className={styles.heroText}>
              <div className={`${styles.revealItem} ${styles.revealed}`}>
                <span className={styles.heroBadge}>
                  <Trophy size={14} />
                  Mumbai &amp; Thane&apos;s Most Trusted Movers
                </span>
              </div>

              <h1 className={`${styles.heroTitle} ${styles.revealItem} ${styles.revealed} ${styles.delay1}`}>
                Move Smarter.<br />
                <span className={styles.heroAccent}>Pay Fairly.</span>
              </h1>

              <p className={`${styles.heroDesc} ${styles.revealItem} ${styles.revealed} ${styles.delay2}`}>
                Triveni Transports offers transparent, itemised pricing for every move —
                no hidden charges, real-time tracking, and a team that treats your
                belongings like their own.
              </p>

              {/* USP glass pill */}
              <div className={`${styles.heroStats} ${styles.revealItem} ${styles.revealed} ${styles.delay3}`}>
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

              {/* ── Download App Now Block ── */}
              <div className={`${styles.appDownloadBlock} ${styles.revealItem} ${styles.revealed} ${styles.delay3}`}>
                <div className={styles.appDownloadHeader}>
                  <span className={styles.appDownloadBadge}>
                    <Smartphone size={14} /> DOWNLOAD OUR APP
                  </span>
                  <span className={styles.appDownloadRating}>
                    <Star size={13} fill="currentColor" /> 4.9 Rating (10,000+ Moves)
                  </span>
                </div>

                <div className={styles.appStoreButtons}>
                  <a href="#download-google-play" className={styles.storeBtn} title="Download on Google Play">
                    <svg className={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.793 12 3.61 22.186A2.247 2.247 0 0 1 3 20.615V3.385c0-.6.23-1.16.609-1.571zm11.603 11.603l2.25 2.25-11.41 6.518 9.16-8.768zm0-2.834L6.052 1.815l11.41 6.518-2.25 2.25zm1.414 1.414l3.197-1.827a1.64 1.64 0 0 0 0 2.848l-3.197 1.826-1.414-1.414 1.414-1.433z"/>
                    </svg>
                    <div className={styles.storeBtnText}>
                      <span className={styles.storeBtnSub}>GET IT ON</span>
                      <span className={styles.storeBtnMain}>Google Play</span>
                    </div>
                  </a>

                  <a href="#download-app-store" className={styles.storeBtn} title="Download on Apple App Store">
                    <svg className={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 0.92-2.84-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.5 2.66-1.25"/>
                    </svg>
                    <div className={styles.storeBtnText}>
                      <span className={styles.storeBtnSub}>Download on the</span>
                      <span className={styles.storeBtnMain}>App Store</span>
                    </div>
                  </a>
                </div>

                <div className={styles.appPerks}>
                  <span>📍 Live GPS Tracking</span>
                  <span className={styles.perkDot}>•</span>
                  <span>⚡ Instant Booking</span>
                  <span className={styles.perkDot}>•</span>
                  <span>🛡️ ₹0 Hidden Costs</span>
                </div>

                <a href="#instant-estimate" className={styles.estimateScrollBtn}>
                  Or calculate instant estimate online below <ArrowDown size={14} />
                </a>
              </div>

            </div>

            {/* ─ Right: Phone Live Tracking Showcase (Desktop) ─ */}
            <div className={`${styles.heroAppPreview} ${styles.revealItem} ${styles.revealed} ${styles.delay2}`}>
              <div className={styles.phoneCard}>
                <div className={styles.phoneNotch} />
                <div className={styles.phoneScreenHeader}>
                  <span className={styles.phoneBrand}>TRIVENI LIVE</span>
                  <span className={styles.phoneLiveBadge}>
                    <span className={styles.livePulseDot} /> EN ROUTE
                  </span>
                </div>

                <div className={styles.phoneRouteCard}>
                  <div className={styles.phoneRouteEndpoints}>
                    <div className={styles.phonePoint}>
                      <span className={styles.phonePointDot} />
                      <span>Thane West (Pickup)</span>
                    </div>
                    <div className={styles.phonePoint}>
                      <span className={`${styles.phonePointDot} ${styles.phonePointDotDest}`} />
                      <span>Andheri East (Delivery)</span>
                    </div>
                  </div>
                  <div className={styles.phoneProgressBar}>
                    <div className={styles.phoneProgressFill} />
                  </div>
                  <div className={styles.phoneEta}>
                    <span>🚚 14ft Closed Container</span>
                    <span>ETA: 25 mins</span>
                  </div>
                </div>

                <div className={styles.phoneDriverCard}>
                  <div className={styles.phoneDriverInfo}>
                    <span className={styles.phoneDriverName}>Ramesh Kumar</span>
                    <span className={styles.phoneDriverSub}>Verified Senior Driver</span>
                  </div>
                  <span className={styles.phoneDriverRating}>
                    <Star size={11} fill="currentColor" /> 4.9
                  </span>
                </div>

                {/* Overlapping floating pills */}
                <div className={styles.floatPill1}>
                  <Shield size={14} color="var(--accent-500)" />
                  <span>₹0 Hidden Charges</span>
                </div>
                <div className={styles.floatPill2}>
                  <Truck size={14} color="var(--accent-500)" />
                  <span>Live GPS Active</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Instant Estimate (Page 2 / Fold 2) ────────── */}
        <section className={`section ${styles.estimateSection}`} id="instant-estimate">
          <div className="container">
            <div
              className={`${styles.revealItem}`}
              style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
            >
              <h2 className="section-heading">Get an Instant Estimate</h2>
              <p className="section-subheading" style={{ marginInline: 'auto' }}>
                Calculate your moving cost in 30 seconds with transparent, line-by-line pricing
              </p>
            </div>

            <div className={styles.estimateWrapper}>
              <InstantEstimate />
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────── */}
        <section className={`section ${styles.howSection}`}>
          <div className="container">
            <div
              className={`${styles.revealItem}`}
              style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}
            >
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
                  delay: styles.delay1,
                },
                {
                  num: '02', Icon: CreditCard,
                  title: 'Book & Pay',
                  desc: 'Lock your date with a small advance. Full payment only after safe delivery.',
                  delay: styles.delay2,
                },
                {
                  num: '03', Icon: Truck,
                  title: 'We Pack & Move',
                  desc: 'Our trained team packs, loads, and transports with care. Track in real-time.',
                  delay: styles.delay3,
                },
                {
                  num: '04', Icon: CheckCircle2,
                  title: 'Delivered!',
                  desc: 'Receive at your new location. Download your invoice. Rate the experience.',
                  delay: styles.delay4,
                },
              ].map((step) => (
                <div key={step.num} className={`${styles.stepCard} ${styles.revealItem} ${step.delay}`}>
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
                <div className={`${styles.trustStat} ${styles.revealItem}`}>
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
            <div
              className={`${styles.revealItem}`}
              style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}
            >
              <h2 className="section-heading">Service Areas</h2>
              <p className="section-subheading" style={{ marginInline: 'auto' }}>
                Core operations across Mumbai &amp; Thane — with long routes to Pune and Gujarat.
              </p>
            </div>
            <div className={styles.areaGrid}>
              {[
                { name: 'Thane', tag: 'Core Zone', type: 'core', delay: styles.delay1 },
                { name: 'Mumbai South', tag: 'Core Zone', type: 'core', delay: styles.delay2 },
                { name: 'Western Suburbs', tag: 'Core Zone', type: 'core', delay: styles.delay3 },
                { name: 'Eastern Suburbs', tag: 'Core Zone', type: 'core', delay: styles.delay1 },
                { name: 'Pune', tag: 'Long Route', type: 'long', delay: styles.delay2 },
                { name: 'Gujarat', tag: 'Long Route', type: 'long', delay: styles.delay3 },
              ].map((area) => (
                <div
                  key={area.name}
                  className={`${styles.areaCard} ${area.type === 'long' ? styles.areaCardLong : ''} ${styles.revealItem} ${area.delay}`}
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
          <div className={styles.ctaGlow} aria-hidden="true" />
          <div className={`${styles.ctaGlass} ${styles.revealItem}`}>
            <h2 className={styles.ctaTitle}>Ready to Move?</h2>
            <p className={styles.ctaDesc}>
              Get your detailed, itemised quote in under 2 minutes. No surprises, ever.
            </p>
            <Link href="/quote" className={styles.ctaBtn}>
              Get Your Free Quote <ArrowRight size={18} />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
