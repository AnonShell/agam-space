import { create } from 'zustand';
import { ServerConfig } from '@agam-space/shared-types';

interface ServerConfigStore {
  config: ServerConfig | null;
  setConfig: (config: ServerConfig) => void;
}

export const useServerConfigStore = create<ServerConfigStore>(set => ({
  config: null,
  setConfig: config => set({ config }),
}));
