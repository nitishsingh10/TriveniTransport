import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Users, Trophy, Clock, CheckCircle2, ArrowRight, HeartHandshake, Truck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Why Choose Triveni Transports — Partner Review and Service Standards',
  description:
    'Learn about Triveni Transports pricing, partner document review, moving standards, and customer support.',
  alternates: {
    canonical: '/trust',
  },
};

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Clear Quote Scope',
    desc: 'Review the quoted services and known charges before booking. Changes to move scope or additional services should be approved and priced before work begins.',
  },
  {
    icon: Users,
    title: 'Partner Document Review',
    desc: 'Triveni reviews partner business, driver, and vehicle documents before enabling service assignments. Ask operations which checks apply to the partner for your move.',
  },
  {
    icon: Trophy,
    title: 'Packing Scope by Service',
    desc: 'Packing materials and handling depend on the service selected. Confirm the quoted scope and any special-item exclusions before booking.',
  },
  {
    icon: Clock,
    title: 'Scheduled Service Window',
    desc: 'Your booking includes a scheduled service window. Contact operations if a delay or schedule change needs to be recorded.',
  },
  {
    icon: Truck,
    title: 'Service-Matched Dispatch',
    desc: 'P&M bookings are assigned to an approved moving business. Pickup and truck requests are offered to approved drivers with a compliant, capacity-fit vehicle.',
  },
  {
    icon: HeartHandshake,
    title: 'Damage and Claims Support',
    desc: 'Contact customer support promptly with your booking details and any relevant photos or documents if an item is lost or damaged. Triveni does not currently provide or arrange transit cover; reporting an issue does not promise reimbursement.',
  },
];

export default function TrustPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.badge}>
              <ShieldCheck size={14} />
              <span>The Triveni Standard</span>
            </div>
            <h1 className={styles.title}>
              Built on Transparency. <span className={styles.titleAccent}>Proven by 10,000+ Moves.</span>
            </h1>
            <p className={styles.subtitle}>
              We founded Triveni Transports to end the nightmare of unreliable movers, unexpected price hikes, and damaged furniture in Mumbai &amp; Thane.
            </p>
          </div>

          <div className={styles.grid}>
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className={styles.card}>
                  <div className={styles.iconWrap}>
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <h3 className={styles.cardTitle}>{p.title}</h3>
                  <p className={styles.cardDesc}>{p.desc}</p>
                </div>
              );
            })}
          </div>

          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Experience the Difference for Your Move</h2>
            <p className={styles.ctaDesc}>
              Calculate your exact itemised quote in under 30 seconds. No phone call spam, no hidden charges.
            </p>
            <Link href="/quote" className={styles.ctaBtn}>
              <span>Calculate Instant Quote</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

