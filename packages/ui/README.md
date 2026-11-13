<p><img src="https://raw.githubusercontent.com/jatinbansal1998/siyahi/main/assets/icon.svg" width="48" height="48" alt="Siyahi"></p>

# Siyahi

A design system for data-heavy React apps: [shadcn/ui](https://ui.shadcn.com)
on [Base UI](https://base-ui.com) and Tailwind CSS v4, with a shared theme,
charts, tables and locale-aware formatters. Components ship in `@siyahi/ui`;
checks and build helpers ship in `@siyahi/tools`.

**[Browse the catalogue](https://siyahi.jatinbansal.com)** for components and live examples.

## For agents

Install the public [Siyahi skill](https://github.com/jatinbansal1998/siyahi/blob/main/skills/siyahi/SKILL.md):

```sh
npx skills add jatinbansal1998/siyahi --skill siyahi --agent claude-code --agent codex
```

Read the installed package's `agents/manifest.json` to select components and
recipes, then only the matching `agents/examples/*.tsx`. Exact prop types are in
`dist/index.d.ts`. The skill guides reuse and verification; page structure and
interactions remain yours. No other skill or local Siyahi checkout is required.

## Install

Releases use the `next` tag until 1.0. Siyahi needs React 19 and Tailwind CSS v4.
Compile its stylesheet with the Tailwind Vite plugin; a plain CSS import leaves
components unstyled.

```sh
npm install @siyahi/ui@next tailwindcss @tailwindcss/vite
npm install --save-dev @siyahi/tools@next
```

```ts
// vite.config.ts: add to your existing plugins
import tailwindcss from "@tailwindcss/vite";
import { preloadFonts } from "@siyahi/tools/vite";
export default defineConfig({ plugins: [react(), tailwindcss(), preloadFonts()] });
```

```css
/* src/index.css */
@import "@siyahi/ui/styles.css";
```

```tsx
// src/main.tsx
import "./index.css";
import { SiyahiProvider } from "@siyahi/ui";
createRoot(root).render(
  <SiyahiProvider>
    <App />
  </SiyahiProvider>,
);
```

`preloadFonts()` loads Geist and Geist Mono with the scripts. Add `lucide-react`
only when your own code imports icons. Next.js compiles the stylesheet through
`@tailwindcss/postcss` instead of the Vite plugin. To host one page as a single
HTML file, build it with `siyahi-page` from `@siyahi/tools`.

If npm is unreachable, both package tarballs are attached to
[GitHub releases](https://github.com/jatinbansal1998/siyahi/releases).

## Locale

`useFormat()` provides `count`, `money`, `moneyCompact`, `pct` and `time`,
bound to the provider's locale. Defaults are Indian English, rupees and India
Standard Time: `₹1,53,110`, `₹2.4L`, `14:30 IST`. Use `Delta` for signed changes.
Override the locale for a whole app or a nested section:

```tsx
<SiyahiProvider locale={{ numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" }}>
```

## Responsive behavior

Data tables suspend horizontal freezing below 40rem of their own available
space, including narrow panels on a laptop. Pinning preferences, search, sort,
selection and expansion stay intact. All columns remain reachable by scrolling;
the scrolling region also accepts keyboard focus. For page-specific compact
records, choose essential columns and keep every other field in accessible
details or an explicit full-table view.

The shipped `data-table-filters` recipe moves secondary filters into a `Sheet`
using `useDataTable().isCompact`. Configure filtering explicitly when its
controls render conditionally. Keep search and the active-filter count visible.
Use container queries for layout and pointer capability for touch targets;
a touch laptop needs the same reachable controls as a phone.

Ranked lists wrap long labels in narrow panels. Horizontal charts reserve space
for bars and wrap their category labels; exact axis ticks keep their normal
text size and scroll when necessary. Heatmap examples expose values on selection
and support one keyboard entry with arrow navigation. `WeekdayHeatmap` accepts
`hours` and `weekdays` to show a relevant domain without changing data labels.

## Surfaces

`SiyahiProvider` sets how data blocks sit on the page:

- `surface="ruled"` (default, even outside a provider): ruled on white.
  `PanelGrid`, `SectionCards` and `MetricStrip` fill their blocks with the card
  colour and part them with hairlines, with a rule above and below each group
  and none on the sides; a card standing alone takes the rules above and below
  itself.
- `surface="card"`: tight square cards, each filled inside a hairline, 8px
  apart, no shadow, for a page of separate blocks.
- `surface="open"`: no fill, boxes or rules; card padding is removed.

`DESIGN.md` has the rest of the look: square corners, mono capital labels,
ledger totals, the masthead and exception tones.

Nest a provider to change one section. A dialog, sheet or popover renders
outside the page's provider element: `PanelGrid` and `SectionCards` carry
their surface into it, but a lone `Card` there is ruled unless the popup's
content sits in its own provider with an explicit surface, such as
`<SiyahiProvider surface="card">`; a provider without one draws no element. Stack `PageSection` blocks with
`flex flex-col gap-6`; use `PanelGrid` for blocks side by side. Categories use
neutral outline badges, leaving colour for meaning and chart series.

## Dark mode

The theme follows the device through `prefers-color-scheme`. For an app-owned
toggle, override the variant after the stylesheet import and set the `dark`
class on `<html>`:

```css
@import "@siyahi/ui/styles.css";
@custom-variant dark (&:where(.dark, .dark *));
```

Set `color-scheme` on `<html>` as well so native controls match.

## Tools

`@siyahi/tools` provides theme lint rules, font preload, layout screenshots
(`siyahi-shots`), loading-shift checks (`siyahi-cls`), contrast checks
(`siyahi-contrast`) and a one-file page build (`siyahi-page`). See the
[tools guide](https://github.com/jatinbansal1998/siyahi/blob/main/packages/tools/README.md)
for configuration and commands.

## Development

```sh
pnpm install
pnpm --filter @siyahi/tools exec playwright install chromium
pnpm check:static   # the full suite runs on each pull request's CI
pnpm dev
```

Read [CONTRIBUTING.md](https://github.com/jatinbansal1998/siyahi/blob/main/CONTRIBUTING.md)
before adding components. Source lives in `packages/ui`, `packages/tools` and
`apps/catalogue`; the catalogue is the visual documentation.

## Licence

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
