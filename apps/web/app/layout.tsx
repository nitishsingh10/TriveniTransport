import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0D1F37',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://trivenitransports.com'),
  title: 'Triveni Transports — Packers & Movers | Mumbai, Thane',
  description: 'Professional packers and movers service in Mumbai, Thane, and nearby areas. Get instant estimates, transparent pricing, and real-time tracking for your move.',
  keywords: 'packers and movers, Mumbai, Thane, shifting, relocation, Triveni Transports',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/logo-cropped.png', sizes: '550x551', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/logo-cropped.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Triveni Transports — Packers & Movers | Mumbai, Thane',
    description: 'Professional packers and movers service in Mumbai, Thane, and nearby areas. Instant estimates & live GPS tracking.',
    images: [{ url: '/logo-cropped.png', width: 550, height: 551, alt: 'Triveni Transports Logo' }],
  },
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

