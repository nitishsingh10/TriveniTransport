import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Apps | Triveni Transports',
  description: 'Choose the separate onboarding process for Packers & Movers vendors or pickup and truck driver partners.',
  alternates: { canonical: '/partners' },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
