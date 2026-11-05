import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Triveni Transports — Packers & Movers',
    short_name: 'Triveni Transports',
    description: 'Professional packers and movers in Mumbai & Thane with transparent pricing, verified captains, and live route tracking.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D1F37',
    theme_color: '#0D1F37',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

