import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Move Bookings — Triveni Transports',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

