// Auth store — persists tokens and user info via AsyncStorage
import { create } from 'zustand';
import type { AuthUser } from '@triveni/shared-types';
import { tokenStorage } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrateAuth: () => Promise<boolean>;
  setHydrated: (hydrated?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    try {
      await tokenStorage.setTokens(accessToken, refreshToken);
      await tokenStorage.setUser(user);
    } catch (e) {
      console.warn('Error persisting customer session:', e);
    }
    set({ user, accessToken, isAuthenticated: true, isHydrated: true });
  },

  clearAuth: async () => {
    try {
      await tokenStorage.clear();
    } catch (e) {
      console.warn('Error clearing customer session:', e);
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isHydrated: true });
  },

  hydrateAuth: async () => {
    try {
      const [token, savedUser] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getUser<AuthUser>(),
      ]);

      if (token) {
        const user: AuthUser = savedUser || {
          id: 'customer',
          role: 'customer',
          name: 'Customer',
        };
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
          isHydrated: true,
        });
        return true;
      }

      set({ user: null, accessToken: null, isAuthenticated: false, isHydrated: true });
      return false;
    } catch (e) {
      console.warn('Customer auth hydration failed:', e);
      set({ user: null, accessToken: null, isAuthenticated: false, isHydrated: true });
      return false;
    }
  },

  setHydrated: (hydrated = true) => set({ isHydrated: hydrated }),
}));
