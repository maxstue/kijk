const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(' --file ')}`;

module.exports = {
  // Lint and Prettify TS and JS files
  'src/**/*.{js,ts,jsx,tsx}': [buildEslintCommand, 'prettier --write -u'],
  // Prettify only Markdown and JSON files
  '{docs,src}/**/*.{json,css,scss,md}': ['prettier -w'],
};
