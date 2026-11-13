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
  Building,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../components/CityLanding.module.css';

export const metadata: Metadata = {
  title: 'Packers and Movers in Mumbai — Top Rated House Shifting & Relocation',
  description:
    'Best packers and movers in Mumbai with transparent itemised pricing. Serving Bandra, Andheri, Powai, Borivali, Dadar, South Mumbai & suburbs. ₹5L transit insurance, verified captains, 0 hidden charges. Get quote!',
  alternates: {
    canonical: '/packers-and-movers-mumbai',
  },
  keywords: [
    'packers and movers in mumbai',
    'house shifting services mumbai',
    'home relocation mumbai',
    'office shifting in mumbai',
    'packers and movers andheri',
    'packers and movers bandra',
    'packers and movers powai',
    'movers and packers south mumbai',
    '1 bhk shifting charges mumbai',
    '2 bhk house moving cost mumbai',
  ],
  openGraph: {
    title: 'Packers and Movers in Mumbai | Triveni Transports',
    description:
      'Transparent itemised pricing for house and office shifting in Mumbai. Verified moving captains, ₹5L insurance, zero surprise charges.',
    url: 'https://trivenitransports.com/packers-and-movers-mumbai',
  },
};

const MUMBAI_AREAS = [
  { name: 'Andheri West & East', sub: 'Lokhandwala, MIDC, JB Nagar' },
  { name: 'Bandra West & East', sub: 'Pali Hill, Hill Road, BKC' },
  { name: 'Powai & Chandivali', sub: 'Hiranandani Gardens, Raheja Vistas' },
  { name: 'Borivali & Kandivali', sub: 'IC Colony, Shimpoli, Thakur Village' },
  { name: 'South Mumbai', sub: 'Colaba, Marine Lines, Malabar Hill, Dadar' },
  { name: 'Goregaon & Malad', sub: 'Film City Rd, Evershine Nagar, Mindspace' },
  { name: 'Chembur & Ghatkopar', sub: 'Diamond Garden, Tilak Nagar, Pant Nagar' },
  { name: 'Vashi & Navi Mumbai', sub: 'Palm Beach Rd, Kharghar, Seawoods' },
  { name: 'Kurla & Santacruz', sub: 'BKC Annex, Kalina, Vakola' },
  { name: 'Lower Parel & Worli', sub: 'Century Mills, Sea Face, High Street' },
];

const MUMBAI_FAQS = [
  {
    q: 'How much do packers and movers in Mumbai charge for a 1 BHK / 2 BHK?',
    a: 'Local Mumbai shifting for a 1 BHK typically ranges from ₹3,499 to ₹6,500 depending on volume and distance. A 2 BHK move typically ranges between ₹6,500 and ₹11,500. Triveni Transports provides 100% itemised quotes online with zero unexpected surcharges on moving day.',
  },
  {
    q: 'How do you handle Mumbai high-rise society moving rules and elevator bookings?',
    a: 'Our experienced crew coordinates with your building security and management for service lift padding, gate pass clearance, and moving time restrictions (such as standard 9 AM to 7 PM society guidelines).',
  },
  {
    q: 'Do you provide waterproof packing during Mumbai monsoon season?',
    a: 'Yes! All sensitive wooden furniture, mattresses, and electronics receive heavy-duty stretch film and waterproof plastic wrapping to withstand Mumbai heavy rains during transit.',
  },
  {
    q: 'Can Triveni Transports handle intercity moves from Mumbai to Pune or Gujarat?',
    a: 'Absolutely. We operate regular dedicated corridors from Mumbai to Pune (express same-day delivery) and Gujarat (Ahmedabad, Surat, Vadodara) with complete toll and route management.',
  },
];

const mumbaiSchema = {
  '@context': 'https://schema.org',
  '@type': 'MovingCompany',
  name: 'Triveni Transports Mumbai',
  url: 'https://trivenitransports.com/packers-and-movers-mumbai',
  telephone: '+918828647785',
  areaServed: {
    '@type': 'City',
    name: 'Mumbai',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '6240',
  },
};

export default function MumbaiLandingPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.trivenitransport.online' },
      { '@type': 'ListItem', position: 2, name: 'Packers & Movers Mumbai', item: 'https://www.trivenitransport.online/packers-and-movers-mumbai' },
    ],
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mumbaiSchema) }}
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
          <span>Packers &amp; Movers Mumbai</span>
        </nav>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.badge}>
            <MapPin size={14} />
            <span>Serving All Mumbai Localities</span>
          </div>
          <h1 className={styles.title}>
            Reliable Packers &amp; Movers in <span className={styles.accent}>Mumbai</span>
          </h1>
          <p className={styles.subtitle}>
            Zero hidden costs. 3-layer protection for high-rise apartments, villas, and corporate offices. Experience seamless doorstep relocation with Mumbai’s trusted movers.
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
              <h2 className={styles.sectionTitle}>Key Mumbai Hubs Covered</h2>
              <p className={styles.sectionDesc}>
                From South Mumbai heritage precincts to western suburbs high-rises and BKC tech parks.
              </p>
            </div>
            <div className={styles.localitiesGrid}>
              {MUMBAI_AREAS.map((a) => (
                <div key={a.name} className={styles.localityCard}>
                  <Building size={20} className={styles.locIcon} />
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
              <h2 className={styles.sectionTitle}>Indicative Moving Rates in Mumbai</h2>
              <p className={styles.sectionDesc}>
                100% transparent pricing based on volume (CFT) and distance. No hidden extortion.
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
                    <td className={styles.priceHighlight}>1 RK / Studio Apartment</td>
                    <td>Up to 25 km</td>
                    <td>Tata Ace + 2 Specialists</td>
                    <td className={styles.priceHighlight}>₹2,999 – ₹4,999</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>1 BHK Flat Shifting</td>
                    <td>Up to 35 km</td>
                    <td>14ft Covered Truck + 3 Crew</td>
                    <td className={styles.priceHighlight}>₹4,499 – ₹6,999</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>2 BHK Household Shifting</td>
                    <td>Up to 40 km</td>
                    <td>14-17ft Truck + 4 Crew</td>
                    <td className={styles.priceHighlight}>₹6,999 – ₹11,499</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>3 BHK / Luxury Penthouse</td>
                    <td>Up to 50 km</td>
                    <td>17-19ft Truck + 5-6 Crew</td>
                    <td className={styles.priceHighlight}>₹11,499 – ₹18,499</td>
                  </tr>
                  <tr>
                    <td className={styles.priceHighlight}>Mumbai to Pune Intercity</td>
                    <td>~150 km corridor</td>
                    <td>Express Dedicated Corridor</td>
                    <td className={styles.priceHighlight}>₹11,999 – ₹21,999</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Mumbai FAQs */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions in Mumbai</h2>
              <p className={styles.sectionDesc}>
                Clear answers for stress-free shifting across the MMR region.
              </p>
            </div>
            <div className={styles.faqStack}>
              {MUMBAI_FAQS.map((faq) => (
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

