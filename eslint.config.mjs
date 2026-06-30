import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "android/app/build/**",
    "android/app/src/main/assets/**",
    "build/**",
    "ios/App/App/public/**",
    "public/fallback-*.js",
    "public/sw.js",
    "public/workbox-*.js",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // These React compiler rules currently flag existing state-sync patterns.
      // Keep lint focused on release-blocking source issues until those can be refactored deliberately.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
