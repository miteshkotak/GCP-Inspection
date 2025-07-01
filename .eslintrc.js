module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es6: true,
    jest: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '*.js' // Ignore compiled JavaScript files in root
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      // Configuration for JavaScript files (like in public folder)
      files: ['*.js'],
      parser: 'espree', // Use default JavaScript parser
      env: {
        browser: true,
        es6: true
      },
      rules: {
        // Disable TypeScript-specific rules for JS files
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      // Configuration for test files
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
      env: {
        jest: true,
        node: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off' // Allow any in tests
      }
    }
  ]
};