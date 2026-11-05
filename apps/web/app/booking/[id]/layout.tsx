import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Booking Radar — Triveni Transports',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}

