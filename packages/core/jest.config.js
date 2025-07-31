import base from '../../jest.preset.js';

/** @type {import('jest').Config} */
export default {
  ...base,
  rootDir: '.',
  displayName: 'core',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
};
