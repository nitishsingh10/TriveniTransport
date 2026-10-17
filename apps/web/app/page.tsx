'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
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
  Navigation,
  Award,
  Users,
  Phone,
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstantEstimate from './components/InstantEstimate';
import styles from './page.module.css';

const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const staggerScroll: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

// ── Scroll-animated "How It Works" section ──────────────────────
function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.85', 'end 0.4'],
  });
  // Truck moves from 0% → 96% width of the track
  const truckX = useTransform(scrollYProgress, [0, 1], ['0%', '92%']);
  // Track fill grows from 0 → full
  const trackScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const steps = [
    { num: '01', Icon: ClipboardList, title: 'Get a Quote', desc: 'Select your items. See transparent, line-by-line pricing instantly.' },
    { num: '02', Icon: CreditCard,    title: 'Book & Pay',  desc: 'Lock your date with a small advance. Full payment only after delivery.' },
    { num: '03', Icon: Truck,         title: 'We Pack & Move', desc: 'Our trained team packs, loads, and transports with real-time tracking.' },
    { num: '04', Icon: CheckCircle2,  title: 'Delivered!',  desc: 'Receive at your new location. Download your invoice. Rate the move.' },
  ];

  return (
    <section className={`section ${styles.howSection}`} ref={sectionRef}>
      <div className="container">
        <motion.div
          initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={scrollReveal}
          style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}
        >
          <h2 className="section-heading" style={{ color: '#ffffff' }}>How It Works</h2>
          <p className="section-subheading" style={{ marginInline: 'auto', color: 'rgba(255,255,255,0.5)' }}>
            Four simple steps — from estimate to doorstep delivery
          </p>
        </motion.div>

        {/* ── Animated truck track ── */}
        <div className={styles.truckTrack}>
          <div className={styles.trackLine} />
          <motion.div
            className={styles.trackFill}
            style={{ scaleX: trackScaleX, transformOrigin: 'left' }}
          />
          <motion.div className={styles.truckIcon} style={{ left: truckX }}>
            <Truck size={28} strokeWidth={2} />
          </motion.div>
        </div>

        {/* ── Step cards ── */}
        <motion.div
          variants={staggerScroll} initial="hidden"
          whileInView="show" viewport={{ once: true, margin: '-80px' }}
          className={styles.steps}
        >
          {steps.map((step) => (
            <motion.div key={step.num} variants={scrollReveal} className={styles.stepCard}>
              <span className={styles.stepNum}>{step.num}</span>
              <div className={styles.stepIconWrap}>
                <step.Icon size={26} strokeWidth={1.75} />
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ──────────────────────────────────────── */}
        <section className={styles.hero}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className={styles.heroImageBg} aria-hidden="true"
          />
          <div className={styles.heroGradient} aria-hidden="true" />
          <div className={styles.heroGlow1} aria-hidden="true" />
          <div className={styles.heroAccentCircle} aria-hidden="true" />

          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroText}>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
                <span className={styles.heroBadge}><Trophy size={14} /> Mumbai &amp; Thane&apos;s Most Trusted Movers</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className={styles.heroTitle}>
                Move Smarter.<br /><span className={styles.heroAccent}>Pay Fairly.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className={styles.heroDesc}>
                Triveni Transports offers transparent, itemised pricing for every move —
                no hidden charges, real-time tracking, and a team that treats your belongings like their own.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} className={styles.heroStats}>
                <div className={styles.stat}><Shield size={26} strokeWidth={2} className={styles.statIcon} /><span className={styles.statLabel}>SAFE</span></div>
                <div className={styles.statDivider} />
                <div className={styles.stat}><Package size={26} strokeWidth={2} className={styles.statIcon} /><span className={styles.statLabel}>RELIABLE</span></div>
                <div className={styles.statDivider} />
                <div className={styles.stat}><Clock size={26} strokeWidth={2} className={styles.statIcon} /><span className={styles.statLabel}>ON TIME</span></div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} className={styles.appDownloadBlock}>
                <div className={styles.appDownloadHeader}>
                  <span className={styles.appDownloadBadge}><Smartphone size={14} /> DOWNLOAD OUR APP</span>
                  <span className={styles.appDownloadRating}><Star size={13} fill="currentColor" /> 4.9 Rating (10,000+ Moves)</span>
                </div>
                <div className={styles.appStoreButtons}>
                  <a href="/download" className={styles.storeBtn} title="Download on Google Play">
                    <svg className={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.793 12 3.61 22.186A2.247 2.247 0 0 1 3 20.615V3.385c0-.6.23-1.16.609-1.571zm11.603 11.603l2.25 2.25-11.41 6.518 9.16-8.768zm0-2.834L6.052 1.815l11.41 6.518-2.25 2.25zm1.414 1.414l3.197-1.827a1.64 1.64 0 0 0 0 2.848l-3.197 1.826-1.414-1.414 1.414-1.433z"/></svg>
                    <div className={styles.storeBtnText}><span className={styles.storeBtnSub}>GET IT ON</span><span className={styles.storeBtnMain}>Google Play</span></div>
                  </a>
                  <a href="/download" className={styles.storeBtn} title="Download on Apple App Store">
                    <svg className={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 0.92-2.84-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.5 2.66-1.25"/></svg>
                    <div className={styles.storeBtnText}><span className={styles.storeBtnSub}>Download on the</span><span className={styles.storeBtnMain}>App Store</span></div>
                  </a>
                </div>
                <div className={styles.appPerks}>
                  <span><MapPin size={12} /> Live GPS Tracking</span>
                  <span className={styles.perkDot}>•</span>
                  <span><Clock size={12} /> Instant Booking</span>
                  <span className={styles.perkDot}>•</span>
                  <span><Shield size={12} /> ₹0 Hidden Costs</span>
                </div>
                <a href="#instant-estimate" className={styles.estimateScrollBtn}>
                  Or calculate instant estimate online below <ArrowDown size={14} />
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Instant Estimate ────────────────────────── */}
        <section className={`section ${styles.estimateSection}`} id="instant-estimate">
          <div className="container">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={scrollReveal} style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <h2 className="section-heading">Get an Instant Estimate</h2>
              <p className="section-subheading" style={{ marginInline: 'auto' }}>Calculate your moving cost in 30 seconds with transparent, line-by-line pricing</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={scrollReveal} className={styles.estimateWrapper}>
              <InstantEstimate />
            </motion.div>
          </div>
        </section>

        {/* ── How It Works (scroll-animated truck) ─────── */}
        <HowItWorks />

        {/* ── Trust Stats Bar ───────────────────────────── */}
        <section className={styles.trustBar}>
          <div className="container">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={scrollReveal} style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
              <h2 className="section-heading">Trusted by Thousands</h2>
              <p className="section-subheading" style={{ marginInline: 'auto' }}>Real numbers from real moves across Mumbai &amp; Thane</p>
            </motion.div>
            <motion.div variants={staggerScroll} initial="hidden" whileInView="show" viewport={{ once: true }} className={styles.trustInner}>
              {[
                { num: '500', suffix: '+', label: 'Happy Families Moved', Icon: Users },
                { num: '4.9', suffix: '★', label: 'Average Rating',       Icon: Star },
                { num: '8',   suffix: '+', label: 'Years of Experience',  Icon: Award },
                { num: '₹0',  suffix: '',  label: 'Hidden Charges. Ever.',Icon: Shield },
              ].map((stat) => (
                <motion.div key={stat.label} variants={scrollReveal} className={styles.trustStat}>
                  <div className={styles.trustIconWrap}><stat.Icon size={22} strokeWidth={1.75} /></div>
                  <span className={styles.trustNum}><span className={styles.trustAccent}>{stat.num}</span>{stat.suffix}</span>
                  <span className={styles.trustLabel}>{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Service Areas ────────────────────────────── */}
        <section className={`section ${styles.areasSection}`}>
          <div className="container">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={scrollReveal} style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 className="section-heading" style={{ color: '#ffffff' }}>Service Areas</h2>
              <p className="section-subheading" style={{ marginInline: 'auto', color: 'rgba(255,255,255,0.5)' }}>
                Core operations across Mumbai &amp; Thane — with long routes to Pune and Gujarat.
              </p>
            </motion.div>
            <motion.div variants={staggerScroll} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} className={styles.areaGrid}>
              {[
                { name: 'Thane',            tag: 'Core Zone',   type: 'core', dist: '0–20 km' },
                { name: 'Mumbai South',     tag: 'Core Zone',   type: 'core', dist: '15–35 km' },
                { name: 'Western Suburbs',  tag: 'Core Zone',   type: 'core', dist: '10–40 km' },
                { name: 'Eastern Suburbs',  tag: 'Core Zone',   type: 'core', dist: '10–30 km' },
                { name: 'Pune',             tag: 'Long Route',  type: 'long', dist: '~150 km' },
                { name: 'Gujarat',          tag: 'Long Route',  type: 'long', dist: '300+ km' },
              ].map((area) => (
                <motion.div key={area.name} variants={scrollReveal} className={`${styles.areaCard} ${area.type === 'long' ? styles.areaCardLong : ''}`}>
                  <div className={styles.areaIconWrap}>
                    {area.type === 'long' ? <Navigation size={18} strokeWidth={2} /> : <MapPin size={18} strokeWidth={2} />}
                  </div>
                  <div className={styles.areaInfo}>
                    <span className={styles.areaName}>{area.name}</span>
                    <span className={`${styles.areaTag} ${area.type === 'long' ? styles.areaTagLong : ''}`}>{area.tag}</span>
                  </div>
                  <span className={styles.areaDistance}>{area.dist}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Ready to Move CTA ───────────────────────── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaGlow} aria-hidden="true" />
          <div className="container">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={scrollReveal} className={styles.ctaGlass}>
              <div className={styles.ctaBadge}>
                <span>VERIFIED RELOCATION PARTNER • MUMBAI &amp; THANE</span>
              </div>
              <h2 className={styles.ctaTitle}>
                Ready to Move <span className={styles.titleAccent}>Without the Stress?</span>
              </h2>
              <p className={styles.ctaDesc}>
                Get an accurate, itemised quote in under 2 minutes. Transparent rates, verified captains, and zero hidden surprises on moving day.
              </p>
              <div className={styles.ctaBtnGroup}>
                <Link href="/quote" className={styles.ctaBtn}>
                  <span>Get Your Free Quote</span>
                  <ArrowRight size={18} />
                </Link>
                <a href="tel:8828647785" className={styles.ctaPhoneBtn}>
                  <Phone size={16} />
                  <span>Call 8828647785</span>
                </a>
              </div>
              <div className={styles.ctaTrustRow}>
                <div className={styles.ctaTrustItem}>
                  <CheckCircle2 size={15} className={styles.trustCheck} />
                  <span>Fixed Price Guarantee</span>
                </div>
                <div className={styles.ctaTrustItem}>
                  <CheckCircle2 size={15} className={styles.trustCheck} />
                  <span>Dedicated Fleet Truck</span>
                </div>
                <div className={styles.ctaTrustItem}>
                  <CheckCircle2 size={15} className={styles.trustCheck} />
                  <span>Live GPS Tracking</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
