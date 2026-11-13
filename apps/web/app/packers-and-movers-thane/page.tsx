import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  ShieldCheck,
  Truck,
  ArrowRight,
  Phone,
  Clock,
  CheckCircle2,
  HelpCircle,
  Building2,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../components/CityLanding.module.css';

export const metadata: Metadata = {
  title: 'Packers and Movers in Thane — Top Home & Office Relocation Services',
  description:
    'Best packers and movers in Thane with transparent line-by-line pricing. Serving Ghodbunder Road, Majiwada, Hiranandani Estate, Vartak Nagar, Naupada & Wagle Estate. ₹5L insurance, verified crew, 0 hidden costs.',
  alternates: {
    canonical: '/packers-and-movers-thane',
  },
  keywords: [
    'packers and movers in thane',
    'movers and packers thane west',
    'packers and movers ghodbunder road thane',
    'house shifting thane',
    'packers and movers majiwada',
    'packers and movers hiranandani estate thane',
    'home shifting charges thane',
    '1 bhk shifting cost thane',
    '2 bhk flat shifting thane west',
    'triveni transports thane',
  ],
  openGraph: {
    title: 'Packers and Movers in Thane | Triveni Transports',
    description:
      'Local headquarters in Thane West. Transparent itemised pricing, verified captains, and zero hidden costs on moving day.',
    url: 'https://trivenitransports.com/packers-and-movers-thane',
  },
};

const THANE_AREAS = [
  { name: 'Ghodbunder Road (GB Road)', sub: 'Brahmand, Kasarvadavali, Haware City' },
  { name: 'Majiwada & Lodha Paradise', sub: 'Rustomjee Urbania, Lodha Grandezza' },
  { name: 'Hiranandani Estate & Meadows', sub: 'Patlipada, One Hiranandani Park' },
  { name: 'Vartak Nagar & Kores', sub: 'Dosti Vihar, Kores Enclave' },
  { name: 'Naupada & Panchpakhadi', sub: 'Gokhale Road, Bhakti Mandir, Talao Pali' },
  { name: 'Pokhran Road 1 & 2', sub: 'Raymond Realty, Tata Serein, Vasant Vihar' },
  { name: 'Wagle Industrial Estate', sub: 'Corporate offices, IT Parks & Warehouses' },
  { name: 'Kalwa & Kharegaon', sub: 'Parsik Nagar, Mumbai-Pune bypass' },
  { name: 'Kalyan & Dombivli Corridor', sub: 'Palava City, Regency Antilia' },
  { name: 'Kasarvadavali & Anand Nagar', sub: 'Purandare Colony, Vijay Garden' },
];

const THANE_FAQS = [
  {
    q: 'Where is the Triveni Transports office in Thane located?',
    a: 'Our registered headquarters is located at Shop No.4, HNO.372, Durganagar, near New Parshwanath college, GB road, Thane West, Maharashtra 400601. Our central location enables rapid dispatch across all Thane localities.',
  },
  {
    q: 'How much does local shifting within Thane cost?',
    a: 'Local moves within Thane start at ₹2,499 for mini moves/single rooms, ₹3,999 to ₹5,999 for 1 BHK flats, and ₹6,499 to ₹9,999 for 2 BHK flats. Use our online instant calculator for an exact line-by-line itemised price.',
  },
  {
    q: 'Do you operate on Ghodbunder Road high-rises and gated townships?',
    a: 'Yes, daily! Our captains are thoroughly familiar with all major townships including Hiranandani Estate, Lodha Amara, Rustomjee Urbania, Dosti West County, and Runwal Eirene.',
  },
  {
    q: 'Can Triveni Transports shift goods from Thane to Mumbai or Pune?',
    a: 'Yes, we handle inter-city routes daily, including Thane to Mumbai Suburbs (Andheri, Bandra, Powai, Borivali) and express Thane-Pune same-day relocation.',
  },
];

const thaneSchema = {
  '@context': 'https://schema.org',
  '@type': 'MovingCompany',
  name: 'Triveni Transports Thane',
  url: 'https://trivenitransports.com/packers-and-movers-thane',
  telephone: '+918828647785',
  areaServed: {
    '@type': 'City',
    name: 'Thane',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop No.4, HNO.372, Durganagar, near New Parshwanath college, GB road',
    addressLocality: 'Thane West',
    addressRegion: 'Maharashtra',
    postalCode: '400601',
    addressCountry: 'IN',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.95',
    reviewCount: '4210',
  },
};

export default function ThaneLandingPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.trivenitransport.online' },
      { '@type': 'ListItem', position: 2, name: 'Packers & Movers Thane', item: 'https://www.trivenitransport.online/packers-and-movers-thane' },
    ],
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(thaneSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className={styles.page}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">›</span>
          <span>Packers &amp; Movers Thane</span>
        </nav>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.badge}>
            <MapPin size={14} />
            <span>Thane West Headquarters</span>
          </div>
          <h1 className={styles.title}>
            Top-Rated Packers &amp; Movers in <span className={styles.accent}>Thane</span>
          </h1>
          <p className={styles.subtitle}>
            Local expertise across Ghodbunder Road, Majiwada, and Hiranandani Estate. Zero hidden surprises, verified captains, and specialized multi-layer packing.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/quote" className={styles.primaryCta}>
              <span>Calculate Instant Quote</span>
              <ArrowRight size={17} />
            </Link>
            <a href="tel:8828647785" className={styles.phoneCta}>
              <Phone size={16} />
              <span>Call 8828647785</span>
            </a>
          </div>
        </section>

        {/* Localities Covered */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Neighborhoods We Serve in Thane</h2>
              <p className={styles.sectionDesc}>
                Comprehensive moving operations throughout Thane City and adjoining MMR townships.
              </p>
            </div>
            <div className={styles.localitiesGrid}>
              {THANE_AREAS.map((a) => (
                <div key={a.name} className={styles.localityCard}>
                  <Building2 size={20} className={styles.locIcon} />
                  <div>
                    <div className={styles.locName}>{a.name}</div>
                    <div className={styles.locSub}>{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Indicative Pricing Table */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Local Shifting Rates in Thane</h2>
              <p className={styles.sectionDesc}>
                Itemised calculations with dedicated vehicles and professional packing crew.
              </p>
            </div>
            <div className={styles.priceTableWrapper}>
              <table className={styles.priceTable}>
                <thead>
                  <tr>
                    <th>Home Configuration</th>
                    <th>Average Distance</th>
                    <th>Crew &amp; Vehicle</th>
                    <th>Estimated Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.priceHighlight}>Few Items / 1 Room</td>
                    <td>Within Thane (10 km)</td>
                    <td>Mini Truck + 2 Helpers</td>
                    <td className={styles.priceHighlight}>₹2,499 – ₹3,999</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>1 BHK Flat Shifting</td>
                    <td>Within Thane (15 km)</td>
                    <td>14ft Covered Truck + 3 Crew</td>
                    <td className={styles.priceHighlight}>₹3,999 – ₹5,999</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>2 BHK Flat Shifting</td>
                    <td>Within Thane / to Mulund</td>
                    <td>14-17ft Truck + 4 Crew</td>
                    <td className={styles.priceHighlight}>₹6,499 – ₹9,999</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>3 BHK / Villa Shifting</td>
                    <td>Across Thane &amp; Suburbs</td>
                    <td>17-19ft Truck + 5 Crew</td>
                    <td className={styles.priceHighlight}>₹9,999 – ₹15,999</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>Thane to Pune Corridor</td>
                    <td>~140 km</td>
                    <td>Dedicated Corridor Express</td>
                    <td className={styles.priceHighlight}>₹10,999 – ₹19,999</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Thane FAQs */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions in Thane</h2>
              <p className={styles.sectionDesc}>
                Everything you need to know about shifting with Triveni in Thane.
              </p>
            </div>
            <div className={styles.faqStack}>
              {THANE_FAQS.map((faq) => (
                <div key={faq.q} className={styles.faqItem}>
                  <div className={styles.faqQuestion}>
                    <span>{faq.q}</span>
                    <HelpCircle size={18} className={styles.accent} />
                  </div>
                  <div className={styles.faqAnswer}>{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

