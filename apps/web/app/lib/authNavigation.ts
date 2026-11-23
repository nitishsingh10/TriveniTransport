const AUTH_ROUTES = new Set(['/login', '/signup', '/vendor/login', '/vendor/signup', '/admin/login']);

const ROLE_DESTINATIONS: Record<string, { fallback: string; allowedPaths: string[] }> = {
  customer: { fallback: '/bookings', allowedPaths: ['/', '/bookings', '/booking', '/quote'] },
  vendor: { fallback: '/vendor/portal', allowedPaths: ['/vendor/portal'] },
  supervisor: { fallback: '/vendor/supervisor', allowedPaths: ['/vendor/supervisor'] },
  admin: { fallback: '/admin', allowedPaths: ['/admin'] },
};

/** Resolve a same-site post-auth destination and reject external or unsafe URLs. */
export function getSafeNextPath(fallback: string, allowedPaths?: string[]): string {
  if (typeof window === 'undefined') return fallback;

  const next = new URLSearchParams(window.location.search).get('next');
  if (!next) return fallback;

  try {
    const destination = new URL(next, window.location.origin);
    if (destination.origin !== window.location.origin || AUTH_ROUTES.has(destination.pathname)) {
      return fallback;
    }

    if (allowedPaths && !allowedPaths.some((path) => (
      path === '/' ? destination.pathname === '/' : destination.pathname === path || destination.pathname.startsWith(`${path}/`)
    ))) return fallback;

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}

/** Resolve a redirect that stays inside the authenticated user's own area. */
export function getRoleSafeDestination(role: string | null): string {
  const destination = ROLE_DESTINATIONS[role ?? 'customer'] ?? ROLE_DESTINATIONS.customer;
  return getSafeNextPath(destination.fallback, destination.allowedPaths);
}
