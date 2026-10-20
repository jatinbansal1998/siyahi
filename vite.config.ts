import { fileURLToPath } from "node:url";
import { recommended as siyahiRules } from "@siyahi/tools/lint";
import { defineConfig } from "vite-plus";

// shadcn core files are refreshed with `shadcn add --overwrite`, so they are
// never formatted, linted or edited here.
const SHADCN_CORE = ["packages/ui/src/components/ui/**", "packages/ui/src/hooks/use-mobile.ts"];
// Registry add-ons stay as close to their upstream copy as our few edits
// allow: not formatted, and linted only for colour rules, in a pass of their
// own (`lint:registry`, config in .oxlintrc.registry.json).
const REGISTRY = "packages/ui/src/components/registry/**";
const GENERATED = [
  "packages/ui/report.css",
  "packages/ui/styles/shadcn.css",
  "packages/ui/registry.lock.json",
  "packages/ui/src/index.ts",
  "packages/ui/README.md",
  "packages/*/LICENSE",
  "packages/*/THIRD_PARTY_NOTICES.md",
];

export default defineConfig({
  resolve: {
    // Tests import @siyahi/ui source files, which use the package's own alias,
    // and catalogue examples, which import the package; both resolve to source
    // so the tests need no build.
    alias: [
      { find: /^@siyahi\/ui$/, replacement: fileURLToPath(new URL("./packages/ui/src/index.ts", import.meta.url)) },
      { find: /^@siyahi\/ui\/(.*)$/, replacement: fileURLToPath(new URL("./packages/ui/src/$1", import.meta.url)) },
    ],
  },
  test: {
    include: ["packages/*/test/**/*.test.{ts,tsx,mjs}", "apps/*/test/**/*.test.tsx"],
  },
  fmt: {
    printWidth: 120,
    // The design and plan are the owner's documents; this repo does not reflow them.
    ignorePatterns: [...SHADCN_CORE, REGISTRY, ...GENERATED, "docs/**", "**/dist/**", "pnpm-lock.yaml", "shots/**"],
    sortPackageJson: {},
  },
  lint: {
    ignorePatterns: [...SHADCN_CORE, REGISTRY, "**/dist/**", "shots/**"],
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
