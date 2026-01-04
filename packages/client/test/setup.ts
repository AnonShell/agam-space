import { getSodium } from '@agam-space/core';

// Initialize libsodium once before all tests in the entire test suite
beforeAll(async () => {
  await getSodium();
});
