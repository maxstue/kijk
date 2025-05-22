/**
 * @type {import('prettier').Config}
 * @see https://prettier.io/docs/configuration
 */
const config = {
  singleQuote: true,
  jsxSingleQuote: true,
  printWidth: 120,
  endOfLine: 'lf',
  semi: true,
  useTabs: false,
  tabWidth: 2,
  tailwindFunctions: ['tv', 'cls', 'cn'],
  plugins: [
    './node_modules/prettier-plugin-jsdoc/dist/index.js',
    'prettier-plugin-tailwindcss',
  ],
};

export default config;
