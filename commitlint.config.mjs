export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'security'],
    ],
    'scope-enum': [
      2,
      'always',
      ['api', 'server', 'web', 'web-verifier', 'core', 'client', 'docker', 'github', 'crypto', 'storage', 'database', 'deps', 'ci', 'release', 'commitlint', 'docs', 'config'],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
