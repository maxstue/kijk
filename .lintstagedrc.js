const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(' --file ')}`;

module.exports = {
  // Lint & Prettify TS and JS files
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
  // Prettify only Markdown and JSON files
  '**/*.(md|json)': (filenames) => `yarn prettier --write ${filenames.join(' ')}`,
};
