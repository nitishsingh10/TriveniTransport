import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Triveni Transports Packers and Movers',
  description:
    'Read the terms of service, moving guarantees, transparent pricing policies, and cancellation guidelines of Triveni Transports.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className={styles.legalPage}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.badge}>
              <FileText size={14} />
              <span>Customer Agreement</span>
            </div>
            <h1 className={styles.title}>Terms &amp; Conditions</h1>
            <p className={styles.subtitle}>
              Last revised: November 2026 • Triveni Transports Packers and Movers
            </p>
          </div>

          <div className={styles.contentCard}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Transparent Pricing &amp; Itemised Quotation</h2>
              <p className={styles.sectionText}>
                Triveni Transports operates on strict zero-hidden-fee pricing. Quotations provided through our web portal or mobile application are based directly on the inventory items declared, origin/destination floors, lift accessibility, and road distance.
              </p>
              <p className={styles.sectionText}>
                Any changes to the inventory on moving day (additional bulky items, extra floors not specified, or lack of service elevator access requiring manual stair carry) may adjust the final bill based on standard per-item CFT rates transparently presented before packing commences.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Booking Advance &amp; Payments</h2>
              <p className={styles.sectionText}>
                To confirm and block dedicated vehicles and moving captains for your requested time slot, a nominal booking advance is required. The balance payment is payable only upon completion of unloading and inspection at your destination.
              </p>
              <ul className={styles.list}>
                <li>We accept UPI, Net Banking, Credit/Debit Cards, and Cash.</li>
                <li>Digital GST tax invoices are generated automatically upon job completion.</li>
                <li>Advance payments are 100% refundable if cancelled up to 24 hours prior to the scheduled slot.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Transit Insurance &amp; Damage Protection</h2>
              <p className={styles.sectionText}>
                Every confirmed move includes standard transit coverage against vehicular accident and fire up to ₹5,00,000. For high-value electronics and fragile antiques, all-risk packaging and insurance cover is strongly recommended and itemised during checkout.
              </p>
              <p className={styles.sectionText}>
                Jewelry, cash, legal title deeds, and personal sovereign documents must be transported personally by the customer and cannot be handed over as packed cargo.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Customer Responsibilities &amp; Society Permissions</h2>
              <p className={styles.sectionText}>
                Customers are responsible for securing necessary society movement permissions, lift reservations, and gate passes at both pickup and delivery premises. Delays caused by lack of society gate access or parking clearances exceeding 2 hours may incur standard detention fees.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Contact &amp; Grievance Redressal</h2>
              <p className={styles.sectionText}>
                For any disputes or claims, contact operations directly at <strong>+91 88286 47785</strong> or email support@trivenitransports.com. Registered office: Shop No.4, HNO.372, Durganagar, GB Road, Thane West, Maharashtra 400601.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

