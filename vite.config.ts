import { fileURLToPath } from "node:url";
import { recommended as siyahiRules } from "@siyahi/tools/lint";
import { defineConfig } from "vite-plus";

// shadcn core files are refreshed with `shadcn add --overwrite`, so they are
// never formatted, linted or edited here. Registry add-ons stay as close to
// their upstream copy as our few edits allow, so they are left alone too.
const COPIED = [
  "packages/ui/src/components/ui/**",
  "packages/ui/src/hooks/use-mobile.ts",
  "packages/ui/src/components/registry/**",
];
const GENERATED = [
  "packages/ui/report.css",
  "packages/ui/styles/shadcn.css",
  "packages/ui/registry.lock.json",
  "packages/ui/src/index.ts",
];

export default defineConfig({
  resolve: {
    // Tests import @siyahi/ui source files, which use the package's own alias.
    alias: [
      { find: /^@siyahi\/ui\/(.*)$/, replacement: fileURLToPath(new URL("./packages/ui/src/$1", import.meta.url)) },
    ],
  },
  test: {
    include: ["packages/*/test/**/*.test.{ts,mjs}"],
  },
  fmt: {
    printWidth: 120,
    // The design and plan are the owner's documents; this repo does not reflow them.
    ignorePatterns: [...COPIED, ...GENERATED, "docs/**", "**/dist/**", "pnpm-lock.yaml", "shots/**"],
    sortPackageJson: {},
  },
  lint: {
    ignorePatterns: [...COPIED, "**/dist/**", "shots/**"],
    plugins: ["eslint", "oxc", "react", "unicorn", "typescript", "import"],
    jsPlugins: ["@siyahi/tools/lint"],
    settings: {
      shadcn: { ui: "@siyahi/ui", themeImports: ["^@siyahi/ui/"] },
    },
    categories: {
      correctness: "error",
      suspicious: "error",
      perf: "warn",
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "import/no-cycle": "error",
      "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
      // The scripts walk one page, one mode at a time on purpose.
      "eslint/no-await-in-loop": "off",
    },
    overrides: [
      {
        files: ["apps/catalogue/src/**", "packages/ui/src/components/siyahi/**", "packages/ui/src/lib/**"],
        rules: siyahiRules,
      },
    ],
    options: {
      reportUnusedDisableDirectives: "error",
    },
  },
});
