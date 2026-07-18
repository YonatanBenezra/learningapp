import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/src/domain/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: () => boolean;
  setAuth: (p: { user: User; accessToken: string; refreshToken: string }) => void;
  setTokens: (p: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

// Session lives in localStorage so a reload keeps the user signed in. Tokens are
// short-lived (access 15m) with rotation on the backend; a future hardening pass
// can move the refresh token to an httpOnly cookie.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: () => Boolean(get().accessToken),
      setAuth: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'abc-auth' },
  ),
);
