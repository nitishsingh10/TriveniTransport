import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner with Us — Join as a Verified Moving Captain | Triveni Transports',
  description: 'Become a verified driver and moving captain partner with Triveni Transports. Guaranteed daily moves, instant weekly payouts, and zero commission cuts on driver labor.',
  alternates: {
    canonical: '/vendor/signup',
  },
  openGraph: {
    title: 'Partner with Triveni Transports as a Moving Captain',
    description: 'Guaranteed daily commercial & household moves across Mumbai and Thane. Steady income and transparent weekly payouts.',
    url: 'https://trivenitransports.com/vendor/signup',
  },
};

export default function VendorSignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

