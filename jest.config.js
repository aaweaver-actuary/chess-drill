// filepath: jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Optional: Configure path aliases like '@/' if you use them
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};