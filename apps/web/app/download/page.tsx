'use client';

import Link from 'next/link';
import { Smartphone, Phone, ArrowLeft, Clock, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import styles from './page.module.css';

export default function DownloadPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Background decorations */}
        <div className={styles.bgGlow1} aria-hidden="true" />
        <div className={styles.bgGlow2} aria-hidden="true" />
        <div className={styles.bgCircle} aria-hidden="true" />

        <div className={styles.card}>
          {/* Phone icon with pulse ring */}
          <div className={styles.iconWrap}>
            <div className={styles.pulseRing} />
            <div className={styles.iconCircle}>
              <Smartphone size={36} strokeWidth={1.75} />
            </div>
          </div>

          {/* Coming Soon badge */}
          <div className={styles.badge}>
            <Clock size={13} />
            <span>Coming Soon</span>
          </div>

          <h1 className={styles.title}>
            Our App is <span className={styles.accent}>Almost Ready</span>
          </h1>

          <p className={styles.desc}>
            We&apos;re putting the finishing touches on the Triveni Transports app.
            Till then, you can reach us directly — we&apos;ll handle everything for you.
          </p>

          {/* Contact CTA */}
          <a href="tel:8828647785" className={styles.callBtn}>
            <span className={styles.callBtnInner}>
              <Phone size={20} strokeWidth={2} />
              <span className={styles.callBtnText}>
                <span className={styles.callBtnSub}>Call us now</span>
                <span className={styles.callBtnNum}>+91 88286 47785</span>
              </span>
            </span>
          </a>

          {/* Stars */}
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
            ))}
            <span className={styles.starsLabel}>4.9 · 10,000+ happy moves</span>
          </div>

          {/* Back link */}
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
