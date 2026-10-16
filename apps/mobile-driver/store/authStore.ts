import { create } from 'zustand';
import type { AuthUser } from '@triveni/shared-types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isOnline: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
  toggleOnline: (status?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,
  isOnline: true,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  setHydrated: () => set({ isHydrated: true }),

  toggleOnline: (status) =>
    set((state) => ({ isOnline: status !== undefined ? status : !state.isOnline })),
}));
