const base = require('../../jest.preset.js');

/** @type {import('jest').Config} */
const config = {
  ...base,
  displayName: 'web',
  rootDir: '.',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/test/**/*.test.ts{,x}'],
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    ...base.moduleNameMapper,
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};

module.exports = config;
