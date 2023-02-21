import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/vocab-search-bar.js",
  output: {
    format: "umd",
    file: "dist/vocab-search-bar.js",
    name: "VocabSearchBar",
    compact: true,
    minifyInternalExports: true,
  },
  plugins: [nodeResolve()],
};
