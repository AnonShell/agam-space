import { create } from 'zustand';

interface BootstrapStore {
  bootstrapped: boolean;
  setBootstrapped: () => void;
}

export const useBootstrapStore = create<BootstrapStore>(set => ({
  bootstrapped: false,
  setBootstrapped: () => set({ bootstrapped: true }),
}));
