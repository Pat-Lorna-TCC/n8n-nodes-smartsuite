/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'], // Tell Jest to look inside /src
  moduleNameMapper: {
    '^n8n-core$': '<rootDir>/src/__mocks__/n8n-core.ts',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Transform .ts and .tsx files
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/src/nodes/SmartSuite/__tests__/**/*.test.ts'], // Match test files in the src directory
  testTimeout: 15000, // 15 second timeout for tests
  maxWorkers: 1, // Run tests serially to avoid timing conflicts
};
