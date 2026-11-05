import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instant Moving Cost Calculator | Transparent Relocation Estimate',
  description:
    'Calculate your exact packing and moving charges in Mumbai and Thane in 30 seconds. Line-by-line itemised quote with volume calculation, packing material choice, and zero hidden fees.',
  alternates: {
    canonical: '/quote',
  },
  openGraph: {
    title: 'Packers and Movers Cost Calculator | Triveni Transports',
    description:
      'Get an instant, itemised quote for your home or office move in Mumbai and Thane. 100% transparent pricing with ₹0 surprise fees.',
    url: 'https://trivenitransports.com/quote',
  },
};

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}

