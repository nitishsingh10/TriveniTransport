import type { Metadata, Viewport } from 'next';
import './globals.css';
import ScrollProgressBar from './components/ScrollProgressBar';
import FloatingActions from './components/FloatingActions';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0D1F37',
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://trivenitransports.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Triveni Transports — Top Packers & Movers in Mumbai & Thane',
    template: '%s | Triveni Transports',
  },
  description:
    'Looking for trusted packers and movers in Mumbai & Thane? Triveni Transports provides transparent itemised pricing, ₹5L transit insurance, verified moving captains, and 0 hidden costs. Get an instant moving quote online in 30 seconds!',
  keywords: [
    'packers and movers in mumbai',
    'packers and movers in thane',
    'house shifting services mumbai',
    'home relocation thane',
    'office relocation services mumbai',
    'best packers and movers near me',
    'movers and packers thane west',
    'furniture shifting mumbai',
    'intercity packers and movers mumbai to pune',
    'triveni transports',
    '1 bhk shifting cost mumbai',
    '2 bhk house shifting charges thane',
    'transparent moving pricing',
    'safe household shifting mumbai',
    'vehicle transport mumbai thane',
  ],
  authors: [{ name: 'Triveni Transports', url: SITE_URL }],
  creator: 'Triveni Transports',
  publisher: 'Triveni Transports',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/icon.png?v=2', type: 'image/png' },
      { url: '/logo-cropped.png?v=2', sizes: '550x551', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: [
      { url: '/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' },
      { url: '/logo-cropped.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Triveni Transports',
    title: 'Triveni Transports — Top Packers & Movers in Mumbai & Thane',
    description:
      'Move smarter with transparent itemised pricing, verified moving captains, ₹5L transit insurance, and 0 hidden costs across Mumbai and Thane.',
    images: [
      {
        url: '/hero-movers.jpg',
        width: 1200,
        height: 630,
        alt: 'Triveni Transports Professional Movers in Mumbai & Thane',
      },
      {
        url: '/logo-cropped.png',
        width: 550,
        height: 551,
        alt: 'Triveni Transports Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Triveni Transports — Packers & Movers Mumbai & Thane',
    description:
      'Transparent itemised pricing, verified captains, and live moving tracking across Mumbai, Thane, and Pune.',
    images: ['/hero-movers.jpg'],
    creator: '@trivenitransports',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'geo.region': 'IN-MH',
    'geo.placename': 'Thane, Mumbai',
    'geo.position': '19.2605;72.9774',
    'ICBM': '19.2605, 72.9774',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'MovingCompany',
  '@id': `${SITE_URL}/#organization`,
  name: 'Triveni Transports',
  legalName: 'Triveni Transports Packers and Movers',
  alternateName: ['Triveni Movers and Packers', 'Triveni Transports Mumbai', 'Triveni Transports Thane'],
  url: SITE_URL,
  logo: `${SITE_URL}/logo-cropped.png`,
  image: `${SITE_URL}/hero-movers.jpg`,
  telephone: '+918828647785',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+918828647785',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi', 'Marathi'],
    },
    {
      '@type': 'ContactPoint',
      telephone: '+918652521009',
      contactType: 'booking inquiry',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi', 'Marathi'],
    },
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop No.4, HNO.372, Durganagar, near New Parshwanath college, GB road',
    addressLocality: 'Thane West',
    addressRegion: 'Maharashtra',
    postalCode: '400601',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 19.2605,
    longitude: 72.9774,
  },
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Net Banking',
  areaServed: [
    { '@type': 'City', name: 'Mumbai' },
    { '@type': 'City', name: 'Thane' },
    { '@type': 'City', name: 'Navi Mumbai' },
    { '@type': 'City', name: 'Kalyan' },
    { '@type': 'City', name: 'Dombivli' },
    { '@type': 'City', name: 'Mira Bhayandar' },
    { '@type': 'City', name: 'Pune' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '22:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '10450',
    bestRating: '5',
    worstRating: '1',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Relocation Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Home Shifting & Household Relocation',
          description:
            'End-to-end 1BHK, 2BHK, 3BHK house shifting with 3-layer bubble packaging, dedicated moving captain, and ₹5L transit insurance.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Office & Commercial Moving',
          description:
            'Careful relocation of office workstations, IT equipment, servers, and executive cabins with minimum business downtime.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Intercity Moving (Mumbai to Pune, Gujarat & Pan-India)',
          description:
            'Dedicated vehicle corridors, toll clearance, live GPS tracking, and scheduled doorstep delivery.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Vehicle Transportation',
          description:
            'Covered, zero-scratch car and two-wheeler relocation across Maharashtra and all major Indian cities.',
        },
      },
    ],
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'Triveni Transports',
  description: 'Top-Rated Packers and Movers in Mumbai and Thane with transparent itemised pricing',
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/icon.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=2" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <ScrollProgressBar />
        {children}
        <FloatingActions />
      </body>
    </html>
  );
}
