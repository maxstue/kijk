import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 120,
  singleQuote: true,
  jsxSingleQuote: true,
  endOfLine: 'lf',
  semi: true,
  useTabs: false,
  tabWidth: 2,
  sortTailwindcss: {
    functions: ['tv', 'cls', 'cn'],
  },
  sortPackageJson: true,
  ignorePatterns: [
    'cache',
    '.cache',
    'package.json',
    'public',
    'CHANGELOG.md',
    'dist',
    'node_modules',
    'build',
    '.gitignore',
  ],
});
