module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testTimeout: 10000,
  extensionsToTreatAsEsm: [],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false
    }]
  }
};