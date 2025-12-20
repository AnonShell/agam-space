import js from '@eslint/js';
import * as tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/public/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/migrations/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/jest.config.js',
      '**/jest.preset.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Turn off or make warnings for common issues
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['**/jest.config.js', '**/jest.preset.js', '**/*.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
  },
];
