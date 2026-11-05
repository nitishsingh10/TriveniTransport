import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up — Triveni Transports Customer Portal',
  description: 'Create your Triveni Transports account to book moves with transparent itemised pricing, track captains in real time, and save addresses.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

