import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download Triveni Transports Mobile App — Live Tracking & Instant Booking',
  description:
    'Download the Triveni Transports Android and iOS app. Book home shifting, track moving truck live on map, manage item inventory, and download GST invoices seamlessly.',
  alternates: {
    canonical: '/download',
  },
  openGraph: {
    title: 'Download Triveni Transports App | Real-Time Moving Radar',
    description:
      'Manage your relocation on the go. Live GPS truck radar, digital inventory signing, and direct captain contact.',
    url: 'https://trivenitransports.com/download',
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}

