import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Home,
  Briefcase,
  Car,
  Truck,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Phone,
  ShieldCheck,
  FileCheck2,
  Clock,
  Compass,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Packers & Movers and Goods Transport Services — Triveni Transports',
  description:
    'Comprehensive shifting and transport services by Triveni Transports across Mumbai & Thane. Full-service home relocation, dedicated pickup & moving trucks, corporate shifting, vehicle transit, and multi-layer protective packaging.',
  alternates: {
    canonical: '/services',
  },
};

const SERVICES = [
  {
    category: 'Packers & Movers',
    icon: Home,
    title: 'Household & Apartment Shifting',
    desc: 'End-to-end home relocation for 1 RK flats to luxury multi-floor villas across Mumbai, Navi Mumbai, and Thane. Complete dismantling, delicate wrapping, safe transit, and room-by-room reassembly.',
    features: [
      'Assigned moving supervisor & trained packing crew',
      'Mattress and sofa dust-proof protective covers',
      'Electrical appliances unmounting & wall-mount support',
      'Careful handling by verified moving partners',
    ],
    highlight: 'Full Packing & Reassembly',
  },
  {
    category: 'Direct Transport',
    icon: Truck,
    title: 'Dedicated Pickup & Moving Trucks',
    desc: 'On-demand commercial tempos and closed-container trucks (Tata Ace, 8ft, 14ft, 17ft, 19ft). Ideal for moving self-packed items, business inventory, or direct door-to-door goods carriage.',
    features: [
      'Verified commercial drivers with active permits, fitness & motor policy',
      'Dedicated point-to-point vehicles with zero co-loading',
      'Volume-matched truck capacity to eliminate split-trip confusion',
      'Direct dispatch confirmation and live delivery milestones',
    ],
    highlight: 'Commercial Fleet on Demand',
  },
  {
    category: 'Corporate Relocation',
    icon: Briefcase,
    title: 'Office & Business Relocation',
    desc: 'Minimal-downtime commercial moves for modular workstations, IT server racks, executive cabins, and sensitive business archives with structured inventory labeling.',
    features: [
      'Overnight and weekend shifting to avoid business interruption',
      'Anti-static bubble wrap for desktop PCs, monitors & servers',
      'Color-coded department and employee workstation boxing',
      'Transparent line-by-line commercial booking summary',
    ],
    highlight: 'Zero Business Downtime',
  },
  {
    category: 'Intercity Corridors',
    icon: Compass,
    title: 'Intercity Corridors (Pan-India)',
    desc: 'Express highway freight along western corridors and nationwide routes. Dedicated sealed container trucks running point-to-point without depot transshipment or mixed cargo.',
    features: [
      'Guaranteed transit timelines on Mumbai–Pune, Gujarat & major routes',
      'Direct contact with assigned vehicle captain',
      'All toll clearances and highway transit documentation managed',
      'Digital trip tracking and delivery sign-off',
    ],
    highlight: 'Zero Transshipment',
  },
  {
    category: 'Vehicle Transport',
    icon: Car,
    title: 'Automobile & Two-Wheeler Transit',
    desc: 'Safe, scratch-free transit for motorcycles, scooters, and cars. Specially fitted closed carriers and customized bike racks with high-tensile wheel locks.',
    features: [
      'Comprehensive pre-transit photographic condition report',
      'Door-to-door vehicle pickup and delivery',
      'Hydraulic ramp loading & soft wheel-locking harnesses',
      'Handled exclusively by verified vehicle transport partners',
    ],
    highlight: 'Scratch-Free Handling',
  },
  {
    category: 'Protective Packaging',
    icon: Layers,
    title: 'Multi-Layer Protective Packing',
    desc: 'Heavy-duty packing engineered to withstand rough transit conditions. Utilizes virgin air bubble sheets, 5-ply corrugated cartons, high-density edge foam, and moisture-barrier stretch wrap.',
    features: [
      'Custom wooden crating for glassware, chinaware & marble tabletops',
      'Wardrobe carton boxes to move clothes on hangers without wrinkles',
      'Industrial-grade moisture-seal adhesive tapes and strapping',
      'Unpacking assistance and complete packing debris removal',
    ],
    highlight: '3-Layer Damage Shield',
  },
];

const TRUST_PILLARS = [
  {
    icon: FileCheck2,
    title: '100% Upfront Itemised Pricing',
    desc: 'Your quote is calculated based on exact item volume (CFT), road distance, and floor elevations. Zero hidden charges or surprise demands on moving day.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Partners Only',
    desc: 'All moving partners submit verified business credentials, signed service contracts, approved commercial schedules, and valid driver vehicle compliance.',
  },
  {
    icon: Clock,
    title: 'Live Booking Milestones',
    desc: 'Clear status updates from confirmation through partner dispatch, arrival, transit, and safe completion on both the web and mobile apps.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className={styles.servicesPage}>
        {/* Ambient Top Glow */}
        <div className={styles.ambientGlow} aria-hidden="true" />

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>Verified Relocation &amp; Transport Network</span>
          </div>
          <h1 className={styles.title}>
            Our Moving &amp; Transport <span className={styles.accent}>Services</span>
          </h1>
          <p className={styles.subtitle}>
            Engineered for reliability, safety, and 100% price transparency. Choose full-service Packers &amp; Movers with trained crews or dedicated pickup trucks for direct goods transport.
          </p>

          {/* Service Pillar Tabs / Tags */}
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>🏠 Household Shifting</span>
            <span className={styles.heroPill}>🚚 Commercial Truck Hire</span>
            <span className={styles.heroPill}>🏢 Office Moves</span>
            <span className={styles.heroPill}>🛣️ Intercity Highway</span>
            <span className={styles.heroPill}>🏍️ Vehicle Shifting</span>
            <span className={styles.heroPill}>📦 3-Layer Packing</span>
          </div>
        </section>

        {/* Services Grid */}
        <section className={styles.section}>
          <div className={styles.serviceGrid}>
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className={styles.serviceCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.iconWrap}>
                      <Icon size={24} strokeWidth={2} />
                    </div>
                    <span className={styles.categoryBadge}>{s.category}</span>
                  </div>

                  <h2 className={styles.serviceTitle}>{s.title}</h2>
                  <p className={styles.serviceDesc}>{s.desc}</p>

                  <ul className={styles.featureList}>
                    {s.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <CheckCircle2 size={15} className={styles.checkIcon} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.cardFooter}>
                    <span className={styles.highlightPill}>{s.highlight}</span>
                    <Link href="/quote" className={styles.cardActionLink}>
                      <span>Get Quote</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Pillars */}
          <div className={styles.trustSection}>
            <div className={styles.trustHeader}>
              <span className={styles.trustEyebrow}>THE TRIVENI TRANSPORTS STANDARD</span>
              <h2 className={styles.trustTitle}>Relocation Without the Guesswork</h2>
            </div>
            <div className={styles.trustGrid}>
              {TRUST_PILLARS.map((pillar) => {
                const PillarIcon = pillar.icon;
                return (
                  <div key={pillar.title} className={styles.trustCard}>
                    <div className={styles.trustIconWrap}>
                      <PillarIcon size={22} strokeWidth={2} />
                    </div>
                    <h3 className={styles.trustCardTitle}>{pillar.title}</h3>
                    <p className={styles.trustCardDesc}>{pillar.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Box */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaGlow} aria-hidden="true" />
            <div className={styles.ctaContent}>
              <span className={styles.ctaBadge}>INSTANT CALCULATION ENGINE</span>
              <h2 className={styles.ctaTitle}>Ready to Plan Your Next Move?</h2>
              <p className={styles.ctaDesc}>
                Get an exact, itemised price quotation in 30 seconds. Choose items, enter pickup and drop addresses, and schedule your move with zero hidden fees.
              </p>
              <div className={styles.ctaActions}>
                <Link href="/quote" className={styles.ctaPrimaryBtn}>
                  <span>Calculate Your Price Now</span>
                  <ArrowRight size={17} />
                </Link>
                <a href="tel:8828647785" className={styles.ctaSecondaryBtn}>
                  <Phone size={16} />
                  <span>Call 88286 47785</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
