# @siyahi/tools

Checks for pages built on [`@siyahi/ui`](https://www.npmjs.com/package/@siyahi/ui).
Kept apart from the UI package so installing the UI does not pull in Playwright.

## Lint plugin

An [oxlint](https://oxc.rs) JS plugin, `siyahi`. Every rule runs only in files
that import `@siyahi/ui`.

| Rule                          | Rejects                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `siyahi/no-color-literal`     | hex, `rgb()`, `hsl()`, `oklch()` and other colour literals in strings                                               |
| `siyahi/no-scheme-variant`    | `dark:` and `light:` Tailwind variants                                                                              |
| `siyahi/no-numeric-font-size` | `fontSize: 13`, `fontSize="12px"`                                                                                   |
| `siyahi/no-raw-colors`        | Tailwind palette colours such as `bg-pink-500` ([@shadcn/lint](https://github.com/shadcn-ui/lint))                  |
| `siyahi/no-arbitrary-values`  | arbitrary values such as `text-[13px]`, `w-[37px]`, `bg-[#fff]` ([@shadcn/lint](https://github.com/shadcn-ui/lint)) |

```json
{
  "jsPlugins": ["@siyahi/tools/lint"],
  "settings": { "shadcn": { "ui": "@siyahi/ui", "themeImports": ["^@siyahi/ui/"] } },
  "rules": { "siyahi/no-color-literal": "error" }
}
```

A Vite+ or ESLint config can spread every rule at once:
`import { recommended } from "@siyahi/tools/lint"`.

## siyahi-shots

```sh
npx siyahi-shots http://localhost:5173/#/page [more URLs] [--out shots] [--gutter 16]
```

Renders each URL in Chromium at 1920 and 390 pixels wide, light and dark, and
writes one full-page PNG per mode to `shots/`. It fails when visible text or a
card comes closer than `--gutter` pixels to either edge (sidebars and content
that scrolls sideways are exempt), when the page scrolls sideways, or when the
body font is not a loaded Geist. Run `npx playwright install chromium` once.

## siyahi-contrast

```sh
npx siyahi-contrast path/to/theme.css
```

Reads the light `:root` block and the dark one under
`@media (prefers-color-scheme: dark)`, and fails unless text colours reach
4.5:1 on the canvas, the card and their own fills, and chart colours reach 3:1
against the card and their neighbours.
