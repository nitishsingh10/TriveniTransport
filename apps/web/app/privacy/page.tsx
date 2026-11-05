import type { Metadata } from 'next';
import { ShieldCheck, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy — Triveni Transports Packers and Movers',
  description:
    'Learn how Triveni Transports protects your personal information, address telemetry, and booking confidentiality.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.legalPage}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.badge}>
              <Lock size={14} />
              <span>Data Protection</span>
            </div>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.subtitle}>
              Last updated: November 2026 • Triveni Transports Commitment to Confidentiality
            </p>
          </div>

          <div className={styles.contentCard}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
              <p className={styles.sectionText}>
                When you request a quotation or book a move with Triveni Transports, we collect contact details (name, phone number, email address), origin and destination addresses, inventory specifications, and geolocation data necessary to execute your move.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Use of Live GPS &amp; Telemetry Data</h2>
              <p className={styles.sectionText}>
                During an active transit job, our platform streams real-time vehicle GPS coordinates to provide you with continuous radar tracking of your cargo. Telemetry broadcasting terminates immediately upon completion and POD sign-off.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Confidentiality &amp; No Data Sale</h2>
              <p className={styles.sectionText}>
                We maintain a strict zero-spam, zero-resale policy. Your personal details, address information, and household inventory are strictly shared only with the assigned verified moving crew for duty execution, and never sold to third-party telemarketers or advertisers.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Payment Security</h2>
              <p className={styles.sectionText}>
                All digital transactions are encrypted via RBI-compliant payment gateways using 256-bit SSL encryption. We never store credit card numbers, CVVs, or UPI PINs on our servers.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Contact Us Regarding Your Data</h2>
              <p className={styles.sectionText}>
                You may request data deletion or update your profile at any time by contacting privacy@trivenitransports.com or calling +91 88286 47785.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

