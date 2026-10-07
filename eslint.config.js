import css from '@eslint/css';
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },

  // JavaScript: the browser code is ES modules; tooling and tests run in Node
  { ...js.configs.recommended, files: ['**/*.js'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.browser },
    rules: {
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.js', 'scripts/**/*.js', 'tests/**/*.js'],
    languageOptions: { globals: globals.node },
  },

  // CSS
  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    rules: {
      ...css.configs.recommended.rules,
      // Only use features supported by current browsers. These two are cosmetic: where unsupported,
      // the slider keeps the default colour and letters can be selected, so the page still works.
      'css/use-baseline': ['error', { available: 'newly', allowProperties: ['accent-color', 'user-select'] }],
    },
  },
];
