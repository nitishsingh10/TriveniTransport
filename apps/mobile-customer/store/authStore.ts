// Auth store — keeps credentials in SecureStore and the non-secret profile in AsyncStorage.
import { create } from 'zustand';
import type { AuthUser } from '@triveni/shared-types';
import { customerApi, setSessionExpiredHandler, tokenStorage } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => Promise<void>;
  updateUser: (partialUser: Partial<AuthUser>) => Promise<void>;
  syncCustomerProfile: () => Promise<AuthUser | null>;
  clearAuth: () => Promise<void>;
  hydrateAuth: () => Promise<boolean>;
  setHydrated: (hydrated?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    try {
      await tokenStorage.setTokens(accessToken, refreshToken);
      await tokenStorage.setUser(user);
    } catch (e) {
      await tokenStorage.clear().catch(() => {});
      console.warn('Error persisting customer session:', e);
      throw e;
    }
    set({ user, accessToken, isAuthenticated: true, isHydrated: true });
  },

  updateUser: async (partialUser) => {
    try {
      const current = get().user;
      if (!current) return;
      const merged = { ...current, ...partialUser };
      await tokenStorage.setUser(merged);
      set({ user: merged });
    } catch (e) {
      console.warn('Error updating user session:', e);
    }
  },

  syncCustomerProfile: async () => {
    const current = get().user;
    if (!current || current.role !== 'customer') return null;

    const profile = await customerApi.getProfile();
    const updated: AuthUser = {
      ...current,
      name: profile.name,
      phone: profile.phone,
      email: profile.email ?? current.email,
      profileCompleted: profile.profileCompleted,
    };

    await tokenStorage.setUser(updated);
    set({ user: updated });
    return updated;
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
        if (!savedUser || savedUser.role !== 'customer' || !savedUser.id) {
          await tokenStorage.clear();
          set({ user: null, accessToken: null, isAuthenticated: false, isHydrated: true });
          return false;
        }
        set({
          user: savedUser,
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

setSessionExpiredHandler(() => {
  void useAuthStore.getState().clearAuth();
});
