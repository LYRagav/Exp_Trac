// e2e/jest.config.js
module.exports = {
  maxWorkers: 1,
  testEnvironment: 'detox/runners/jest/testEnvironment',
  runner: 'jest-circus/runner',
  testRunner: 'jest-circus/runner',
  testTimeout: 120000,
  preset: 'ts-jest',
  transform: {
    '^.+\\\.tsx?$': 'ts-jest',
  },
  testRegex: '\\.e2e\\.ts$',
  reporters: ['detox/runners/jest/reporter'],
  verbose: true,
  globals: {
    'ts-jest': {
      tsconfig: './e2e/tsconfig.json',
    },
  },
}; 