'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { token, auth, customer } from './api';

export interface AuthUser {
  id?: string;
  role?: string;
  name?: string;
  phone?: string;
  email?: string;
  profileCompleted?: boolean;
}

export interface UseAuthReturn {
  isLoggedIn: boolean;
  role: string | null;
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

function parseJwt(jwtToken: string): any | null {
  try {
    const base64Url = jwtToken.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function useAuth(): UseAuthReturn {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const customerProfileHydrationStarted = useRef(false);

  const syncAuth = useCallback(() => {
    const logged = token.isLoggedIn();
    setIsLoggedIn(logged);

    if (!logged) {
      setRole(null);
      setUser(null);
      setLoading(false);
      return;
    }

    const currentRole = token.getRole();
    const storedUser = token.getUser();

    if (storedUser) {
      setUser(storedUser);
      setRole(storedUser.role || currentRole || 'customer');
    } else {
      // Fallback: extract payload from JWT access token
      const access = token.getAccess();
      if (access) {
        const payload = parseJwt(access);
        const derivedRole = payload?.role || currentRole || 'customer';
        const fallbackUser: AuthUser = {
          id: payload?.sub,
          role: derivedRole,
          name: derivedRole === 'admin' ? 'Administrator' : derivedRole === 'vendor' ? 'Driver Partner' : 'Valued Customer',
        };
        setUser(fallbackUser);
        setRole(derivedRole);
        token.setUser(fallbackUser);
      } else {
        setRole(currentRole || 'customer');
        setUser({ role: currentRole || 'customer', name: 'Valued Customer' });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    syncAuth();

    const handleAuthChange = () => {
      syncAuth();
    };

    window.addEventListener('tt_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('tt_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [syncAuth]);

  useEffect(() => {
    if (!isLoggedIn) {
      customerProfileHydrationStarted.current = false;
      return;
    }
    if (role !== 'customer' || customerProfileHydrationStarted.current) return;

    customerProfileHydrationStarted.current = true;
    customer.getProfile().then((profile) => {
      token.setUser({
        ...(token.getUser() || {}),
        id: profile.id,
        role: 'customer',
        name: profile.name,
        phone: profile.phone || '',
        email: profile.email || undefined,
        profileCompleted: profile.profileCompleted,
      });
    }).catch(() => {
      // Keep the cached session usable while the profile service is unavailable.
    });
  }, [isLoggedIn, role]);

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      token.clear();
      setIsLoggedIn(false);
      setRole(null);
      setUser(null);
    }
  }, []);

  return {
    isLoggedIn,
    role,
    user,
    loading,
    logout,
  };
}
