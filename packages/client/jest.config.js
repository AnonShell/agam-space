const base = require('../../jest.preset.js');

/** @type {import('jest').Config} */
const config = {
  ...base,
  displayName: 'client',
  rootDir: '../..',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/packages/client/tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@agam-space/(.*)$': '<rootDir>/packages/$1/src',
  },
  testMatch: ['<rootDir>/packages/client/test/**/*.test.ts'],
  coverageDirectory: '<rootDir>/packages/client/coverage',
};

module.exports = config;
