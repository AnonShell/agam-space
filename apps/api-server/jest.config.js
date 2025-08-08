const base = require('../../jest.preset.js');

/** @type {import('jest').Config} */
const config = {
  ...base,
  displayName: 'api-server',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    ...base.moduleNameMapper,
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = config;
