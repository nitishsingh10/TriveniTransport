import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Triveni Transports — Packers & Movers | Mumbai, Thane',
  description: 'Professional packers and movers service in Mumbai, Thane, and nearby areas. Get instant estimates, transparent pricing, and real-time tracking for your move.',
  keywords: 'packers and movers, Mumbai, Thane, shifting, relocation, Triveni Transports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
