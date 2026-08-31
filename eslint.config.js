// eslint.config.js
module.exports = [
  {
    languageOptions: {
      globals: {
        // Define any global variables here (e.g., for browsers)
        window: 'readonly',
        document: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 12, // ES2021
        sourceType: 'module', // Enable ES6 modules
      },
    },
    rules: {
      'no-console': 'warn',  // Warn on console statements
      'semi': ['error', 'always'], // Enforce semicolons
      'quotes': ['error', 'single'], // Enforce single quotes
      'eqeqeq': 'error', // Enforce strict equality (===)
      'curly': 'error', // Enforce curly braces for control statements
      'no-unused-vars': 'warn', // Warn about unused variables
      'no-magic-numbers': 'off', // Optional: disable rule for magic numbers if you want
    },
  },
];
