import { create } from 'zustand';
import type { User } from '@/src/domain/user';
import type { AuthBootstrapPhase } from '@/src/features/auth/authLoadingMessages';

interface AuthState {
  user: User | null;
  sessionReady: boolean;
  bootstrapPhase: AuthBootstrapPhase;
  setUser: (user: User | null) => void;
  setSessionReady: (ready: boolean) => void;
  setBootstrapPhase: (phase: AuthBootstrapPhase) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

// Auth tokens live in httpOnly cookies — never in localStorage (XSS-safe).
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  sessionReady: false,
  bootstrapPhase: 'starting',
  setUser: (user) => set({ user }),
  setSessionReady: (sessionReady) => set({ sessionReady }),
  setBootstrapPhase: (bootstrapPhase) => set({ bootstrapPhase }),
  clear: () => set({ user: null, sessionReady: true, bootstrapPhase: 'ready' }),
  isAuthenticated: () => Boolean(get().user),
}));
