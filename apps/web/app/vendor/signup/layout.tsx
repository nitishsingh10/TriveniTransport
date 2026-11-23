import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply as a Packers & Movers Partner | Triveni Transports',
  description: 'Apply to join the Triveni Transports packers and movers network. Submit your business details and documents for review before receiving P&M orders.',
  alternates: {
    canonical: '/vendor/signup',
  },
  openGraph: {
    title: 'Apply as a Packers & Movers Partner',
    description: 'Submit your business details and documents for review before receiving P&M orders.',
    url: 'https://trivenitransports.com/vendor/signup',
  },
};

export default function VendorSignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

