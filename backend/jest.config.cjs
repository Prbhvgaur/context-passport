/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: [
    'src/app.ts',
    'src/controllers/**/*.ts',
    'src/middleware/**/*.ts',
    'src/routes/**/*.ts',
    'src/services/compression-service.ts',
    'src/services/encryption-service.ts',
    'src/services/session-service.ts',
    'src/services/user-service.ts',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 40,
      functions: 75,
      lines: 80,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@context-passport/shared$': '<rootDir>/../shared/src/index.ts',
    '^@context-passport/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
};
