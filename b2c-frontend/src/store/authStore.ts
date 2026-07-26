import { create } from 'zustand';
import type { User } from '@/src/domain/user';

interface AuthState {
  user: User | null;
  sessionReady: boolean;
  setUser: (user: User | null) => void;
  setSessionReady: (ready: boolean) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

// Auth tokens live in httpOnly cookies — never in localStorage (XSS-safe).
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  sessionReady: false,
  setUser: (user) => set({ user }),
  setSessionReady: (sessionReady) => set({ sessionReady }),
  clear: () => set({ user: null, sessionReady: true }),
  isAuthenticated: () => Boolean(get().user),
}));
