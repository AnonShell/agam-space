import { create } from 'zustand';
import { User } from '@agam-space/shared-types';

interface AuthStore {
  user: User | null;

  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuth = create<AuthStore>(set => ({
  user: null,
  setUser: user => set({ user }),
  clear: () => set({ user: null }),
}));

export const useIsLoggedIn = () => !!useAuth(s => s.user);
export const useUserId = () => useAuth(s => s.user?.id ?? null);
