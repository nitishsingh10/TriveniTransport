import { create } from 'zustand';
import type { AuthUser } from '@triveni/shared-types';
import { tokenStorage } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isOnline: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrateAuth: () => Promise<boolean>;
  setHydrated: (hydrated?: boolean) => void;
  toggleOnline: (status?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,
  isOnline: true,

  setAuth: async (user, accessToken, refreshToken) => {
    try {
      await tokenStorage.setTokens(accessToken, refreshToken);
      await tokenStorage.setUser(user);
    } catch (e) {
      console.warn('Error persisting driver session:', e);
    }
    set({ user, accessToken, isAuthenticated: true, isHydrated: true });
  },

  clearAuth: async () => {
    try {
      await tokenStorage.clear();
    } catch (e) {
      console.warn('Error clearing driver session:', e);
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
          id: 'driver-partner',
          role: 'vendor',
          name: 'Driver Partner',
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
      console.warn('Driver auth hydration failed:', e);
      set({ user: null, accessToken: null, isAuthenticated: false, isHydrated: true });
      return false;
    }
  },

  setHydrated: (hydrated = true) => set({ isHydrated: hydrated }),

  toggleOnline: (status) =>
    set((state) => ({ isOnline: status !== undefined ? status : !state.isOnline })),
}));
