import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Users, Trophy, Clock, CheckCircle2, ArrowRight, HeartHandshake, Truck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Why Choose Triveni Transports — Trust, Transparency & Safety Standards',
  description:
    'Discover why 10,000+ families trust Triveni Transports. 100% itemised pricing, ₹5L transit insurance, background-verified crews, and zero hidden charges on moving day.',
  alternates: {
    canonical: '/trust',
  },
};

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Zero Hidden Charges Guarantee',
    desc: 'What you see in your itemised quote is what you pay. No last-minute extortion for stairs, packing tapes, or toll taxes.',
  },
  {
    icon: Users,
    title: 'Background-Verified Captains',
    desc: 'Every driver partner and packing crew member undergoes rigorous police background checks and training in handling delicate goods.',
  },
  {
    icon: Trophy,
    title: 'Multi-Layer Packing Standard',
    desc: 'Heavy-duty bubble wrap, corner guards, corrugated sheets, and stretch film ensure 100% scratch-free transport.',
  },
  {
    icon: Clock,
    title: 'Guaranteed On-Time Arrival',
    desc: 'We value your schedule. Dedicated vehicles are dispatched to arrive at your door precisely in your chosen time slot.',
  },
  {
    icon: Truck,
    title: 'Dedicated Fleet Vehicles',
    desc: 'Never share space with random commercial freight. Your household items travel in a dedicated, sealed vehicle.',
  },
  {
    icon: HeartHandshake,
    title: 'Direct Claims Redressal',
    desc: 'In the rare event of transit damage, our operations team processes claims swiftly under our ₹5,00,000 transit cover.',
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

