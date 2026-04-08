/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/utils/chrome.ts',
    'src/utils/content-script.ts',
    'src/utils/session-export.ts',
    'src/utils/storage.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 55,
      functions: 75,
      lines: 80,
    },
  },
  moduleNameMapper: {
    '^@context-passport/shared$': '<rootDir>/../shared/src/index.ts',
    '^@context-passport/shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
