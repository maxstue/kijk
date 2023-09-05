module.exports = {
  // Lint and Prettify TS and JS files
  'src/**/*.{js,ts,jsx,tsx}': ['prettier --write -u --ignore-path=.gitignore'],
  // Prettify only Markdown and JSON files
  '{docs,src}/**/*.{json,css,scss,md}': ['prettier -w --ignore-path=.gitignore'],
};
