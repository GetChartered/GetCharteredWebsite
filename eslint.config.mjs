import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  //
  {
    rules: {
      // Turn off "Unexpected any"
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone AWS Lambda reference code (see backend-reference/README.md)
    // — plain CommonJS Node.js meant to be zipped and deployed on its own,
    // not part of this Next.js app's build, so this project's ESM-oriented
    // TypeScript/Next lint rules (e.g. no-require-imports) don't apply to it.
    "backend-reference/**",
  ]),
]);

export default eslintConfig;
