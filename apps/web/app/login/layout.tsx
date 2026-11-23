import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Login — Access Your Move Status & Invoices',
  description: 'Log in to your Triveni Transports account to manage active bookings and track your move.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

