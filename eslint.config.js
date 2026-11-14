import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'build/**/*', 'drizzle/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
