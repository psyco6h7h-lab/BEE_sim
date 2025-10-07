module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Allow unused variables that start with underscore
    '@typescript-eslint/no-unused-vars': ['warn', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'ignoreRestSiblings': true
    }],
    // Allow console statements in development
    'no-console': 'off',
    // Allow unused imports in development
    'no-unused-vars': 'off',
    // Disable react-hooks/exhaustive-deps for faster loading
    'react-hooks/exhaustive-deps': 'off'
  },
  // Ignore source map warnings from node_modules
  ignorePatterns: [
    'node_modules/**',
    'build/**',
    'dist/**'
  ]
};
