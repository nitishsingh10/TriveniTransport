import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Portal Login — Triveni Transports',
  description: 'Log in to the Triveni Transports Partner Portal to view assigned duties, submit digital PODs, and check earnings.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function VendorLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

