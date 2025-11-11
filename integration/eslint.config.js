const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '*.config.ts', 'artifacts/', 'cache/', 'test/generated.ts'],
  },
  {
    rules: {
      // Customize rules as needed
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Disable require-await as our paymaster hooks may be async for interface consistency
      // even when they don't need await expressions
      '@typescript-eslint/require-await': 'off',
    },
  }
);

