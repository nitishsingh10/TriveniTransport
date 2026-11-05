import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Home,
  Briefcase,
  Car,
  Package,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Packing & Moving Services — Household, Office & Vehicle Relocation',
  description:
    'Comprehensive shifting services by Triveni Transports across Mumbai & Thane. 1BHK, 2BHK, 3BHK home relocation, office shifting, vehicle transit, and 3-layer protective packing.',
  alternates: {
    canonical: '/services',
  },
};

const SERVICES = [
  {
    icon: Home,
    title: 'Household & Home Shifting',
    desc: 'From cozy 1 RK studios to spacious luxury villas. We handle everything from dismantling double beds and wardrobes to careful wrapping of glassware, crockeries, and LED screens.',
    features: [
      'Dedicated moving captain on site',
      'Mattress and sofa dust-proof covers',
      'Electrical appliances unmounting & mounting support',
      'Transit insurance coverage up to ₹5,00,000',
    ],
  },
  {
    icon: Briefcase,
    title: 'Office & Corporate Relocation',
    desc: 'Minimal downtime commercial moves. We pack and transport modular workstations, IT server racks, executive seating, and business archives with systematic labeling.',
    features: [
      'Weekend and after-hours shifting availability',
      'Anti-static bubble wrap for desktop PCs and servers',
      'Color-coded department and employee boxing',
      'GST tax invoicing with line-item breakdown',
    ],
  },
  {
    icon: Car,
    title: 'Vehicle Transport (Cars & Bikes)',
    desc: 'Safe, scratch-free automobile transit. Specially equipped closed car carrier trailers and custom bike stands with wheel locks for interstate and intrastate moves.',
    features: [
      'Comprehensive pre-transit photographic condition report',
      'Door-to-door vehicle pickup and delivery',
      'Wheel chocks & hydraulic ramp loading',
      'All-India transit insurance',
    ],
  },
  {
    icon: Layers,
    title: 'Specialized 3-Layer Packing',
    desc: 'Superior protection using virgin bubble sheets, 5-ply corrugated cartons, high-density edge foam, and cling film wrap to ensure zero transit scuffs or moisture ingress.',
    features: [
      'Fragile item crates for chinaware and marble tabletops',
      'Wardrobe carton boxes for wrinkle-free clothes',
      'Heavy-duty industrial adhesive tapes',
      'Unpacking and debris removal assistance',
    ],
  },
  {
    icon: Truck,
    title: 'Intercity Moving (Mumbai – Pune – Pan-India)',
    desc: 'Express relocation along Western corridors and nationwide. Dedicated point-to-point trucks with zero transshipment or co-loading with random commercial cargo.',
    features: [
      'Guaranteed delivery timeline commitment',
      'Real-time truck radar tracking on mobile app',
      'Direct contact with assigned vehicle captain',
      'Toll clearances and interstate transit documentation',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Short & Long Term Secure Storage',
    desc: 'Pest-controlled, 24/7 CCTV-monitored warehouse facilities across Thane and MMR. Perfect for between-home gaps, home renovations, or extended relocations.',
    features: [
      'Fire-safe, waterproof facility',
      'Palletized storage with shrink-wrapping',
      'Flexible monthly or quarterly rental plans',
      'Complete inventory documentation',
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className={styles.servicesPage}>
        {/* Header */}
        <section className={styles.hero}>
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>End-to-End Relocation Solutions</span>
          </div>
          <h1 className={styles.title}>
            Our Packing &amp; Moving <span className={styles.accent}>Services</span>
          </h1>
          <p className={styles.subtitle}>
            Engineered for safety, speed, and 100% price transparency. Choose the service tailored to your home or business.
          </p>
        </section>

        {/* Services Grid */}
        <section className={styles.section}>
          <div className={styles.serviceGrid}>
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className={styles.serviceCard}>
                  <div className={styles.iconWrap}>
                    <Icon size={26} strokeWidth={1.9} />
                  </div>
                  <h2 className={styles.serviceTitle}>{s.title}</h2>
                  <p className={styles.serviceDesc}>{s.desc}</p>
                  <ul className={styles.featureList}>
                    {s.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <CheckCircle2 size={16} className={styles.checkIcon} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* CTA Box */}
          <div className={styles.ctaSection}>
            <h2 className={styles.ctaTitle}>Ready to Plan Your Next Move?</h2>
            <p className={styles.ctaDesc}>
              Get a line-by-line itemised price quotation in 30 seconds with our online instant calculation engine.
            </p>
            <Link href="/quote" className={styles.ctaBtn}>
              <span>Calculate Your Price Now</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

