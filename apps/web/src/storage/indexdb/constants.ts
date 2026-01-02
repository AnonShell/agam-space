export const STORE_NAMES = {
  SESSION_DATA: 'session-data',
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];
