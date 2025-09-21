// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.eslint.json'], // <- point ESLint to the dedicated config
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'n8n-nodes-base'],
  extends: [
    'plugin:@typescript-eslint/recommended', // TS best practices
    'plugin:n8n-nodes-base/nodes',           // n8n’s node ruleset
  ],
  rules: {
    // n8n plugin rules to disable globally
    'n8n-nodes-base/param-description-missing-where-optional': 'off',
    'n8n-nodes-base/options-not-alphabetical':                'off',
    'n8n-nodes-base/continue-on-fail-not-implemented':        'off',
    'n8n-nodes-base/credentials-test-method-missing':         'off',
    'n8n-nodes-base/regular-node-with-no-input':              'off',
    'n8n-nodes-base/default-value-missing':                   'off',

    // Enforce TS best practices globally
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-expect-error': 'allow-with-description',
      'minimumDescriptionLength': 4,
    }],
  },
  overrides: [
    {
      files: ['src/nodes/SmartSuite/**/*.ts'],
      rules: {
        // Disable n8n-plugin rules for SmartSuite node files
        'n8n-nodes-base/node-filename-against-convention':              'off',
        'n8n-nodes-base/node-class-description-outputs-wrong':         'off',
        'n8n-nodes-base/node-param-options-type-unsorted-items':       'off',
        'n8n-nodes-base/node-param-description-weak':                  'off',
        'n8n-nodes-base/node-param-description-boolean-without-whether':'off',
        'n8n-nodes-base/node-param-operation-option-action-miscased':  'off',
        'n8n-nodes-base/node-param-array-type-assertion':              'off',
        'n8n-nodes-base/node-param-type-options-max-value-present':    'off',
        'n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options':'off',
        'n8n-nodes-base/node-param-description-wrong-for-limit':       'off',
        'n8n-nodes-base/node-param-description-wrong-for-return-all':  'off',
        'n8n-nodes-base/node-param-description-missing-final-period':  'off',
        'n8n-nodes-base/node-param-description-wrong-for-dynamic-options':'off',

        // TS rules specific to SmartSuite files
        '@typescript-eslint/no-unused-vars':       'warn',
        '@typescript-eslint/no-explicit-any':      'off',
        '@typescript-eslint/no-inferrable-types':  'off',
        '@typescript-eslint/ban-types':            'off',
      },
    },
    {
      files: ['src/__mocks__/**/*.ts', 'src/types/**/*.d.ts'],
      parserOptions: { project: null }, // <- disable type-aware parsing
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['src/**/__tests__/**/*.ts'],
      parserOptions: { project: null }, // <- disable type-aware parsing
      env: {
        jest: true, // or { 'vitest/globals': true } if you use Vitest
      },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/ban-ts-comment':    'off',
        '@typescript-eslint/no-unused-vars':   'off',
        '@typescript-eslint/no-explicit-any':  'off',
      },
    },
    {
      files: ['src/nodes/SmartSuite/shared/__testHelpers__/**/*.ts'],
      parserOptions: { project: null }, // <- disable type-aware parsing
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/'], // don’t lint build output
};
