/** @type {import("prettier").Config} */
const config = {
  singleQuote: true,
  jsxSingleQuote: true,
  printWidth: 120,
  endOfLine: "lf",
  semi: true,
  useTabs: false,
  tabWidth: 2,
  importOrder: [
    "<BUILTIN_MODULES>",
    "^(react/(.*)$)|^(react$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/(.*)$",
    "<TYPES>",
    "<TYPES>^[.]",
    "",
    "^[./]",
    "^(?!.*[.]css$)[./].*$",
    ".css$"
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.0.0",
  tailwindFunctions: ["tv", "cls"],
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "./node_modules/prettier-plugin-jsdoc/dist/index.js",
    "prettier-plugin-tailwindcss"
  ]
};

export default config;
