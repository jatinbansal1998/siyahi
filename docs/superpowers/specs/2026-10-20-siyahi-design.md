# Siyahi design

Date: 2026-10-20. Author: Claude with Jatin Bansal. Status: draft, builder-checked once (Opus 5.5); Jatin answered the open questions. Second check pending.

## In six lines

Siyahi (Hindi for ink) replaces Kajal's hand-made token system with stock shadcn/ui on
Tailwind v4 and Base UI, shipped as one public package, `@siyahi/ui`, that dash and The
Book (the transactions analyser) install and anyone else may use. The look is shadcn's default neutral theme in the `base-vega` style, with four
added colours (gain, loss, warning, link). Cards hold data, prose sits on the page. The
Book moves to React so both apps share one component set. Components are installed, not
written; a lint stops anyone from writing a raw colour or size. Static HTML reports get
a small CSS file and five layout rules instead of React.

## Why

Kajal 1.x shipped only tokens. Both apps rebuilt the same ten components by hand and
drifted. dash's Mantine mapping needed hand patches because Mantine orders greys by
lightness and Kajal by role. Only 3 of dash's 56 pages use Kajal. The checks that keep
pages on-spec exist only in dash. Jatin is not a UI engineer; agents build and maintain
every page, and agents follow typed components and lint better than prose rules.

## Goals

1. As little code of our own as possible. Every component is installed from shadcn or a
   shadcn-format registry and taken as is; Siyahi writes only what no registry offers.
   Updates come from re-running the CLI, not from maintaining forks.
2. One package, one stack, one catalogue: an agent learns one import path and one page
   of examples.
3. A future visual change is a theme-file edit plus a handful of component files, with
   zero page edits.
4. The Book and dash look like one product.
5. Static HTML reports (single files agents generate) look right in light and dark.
6. Usable by strangers. The repo is public and MIT licensed. Nothing in the package
   assumes Jatin's hosts, URLs or repos; Indian number and IST formatting are the
   default locale but are one setting away from another. The README installs it in five
   lines, and the catalogue is the documentation.

## Non-goals

- Migrating any dash page other than the Dell page. The other 55 pages, including the
  two other Kajal 1.x pages, stay on Mantine as they are and may drift slightly.
- A manual light/dark toggle. The scheme follows the device.
- t3code's theme machinery beyond what is listed under "borrowed".
- Supporting non-React consumers after The Book moves.
- Sandboxed iframes and measured heights for reports. Reports stay plain pages linked
  from the dash index, as today.

## Anti-goals

- A second implementation of any component anywhere. If the package lacks it, add it to
  the package first.
- Raw hex, `rgb()`, `oklch()`, numeric font sizes, or Tailwind arbitrary values
  (`text-[13px]`, `bg-[#fff]`) in page code.
- Pages hand-rolling a card, table, badge or tab.

## Decisions already made

| Area | Decision |
|---|---|
| Stack | React 19, shadcn/ui on Base UI, Tailwind v4, Vite. TypeScript throughout, explicit types on public signatures. |
| shadcn style | `base-vega` (24px card padding, 14px body, `shadow-xs`). Jatin chose the roomy look over the dense one; Mira is the compact style. Stock sizes from the style; no Kajal size table. (Claude's call from Jatin's preference.) |
| Theme values | shadcn default `neutral`, stock values, both schemes. Dark canvas `oklch(0.145 0 0)`, which is `#0a0a0a`, the value Kajal 1.0.2 already settled on. |
| Added tokens | `--positive`, `--negative`, `--warning`, `--link`, each with a `-foreground` where a fill needs one. Values start from Tailwind green, red, amber and the shadcn `blue` chart preset and are adjusted per scheme until text passes 4.5:1 on the canvas and on the card. Nothing else. |
| Contrast | 4.5:1 for any text colour on canvas and card, checked by a script in the package build, as Kajal 1.x did. The check fails the build; values are fixed, never the bar. |
| Graded colour | Heat maps and signed scales use `color-mix()` steps of `--positive` and `--negative` toward the card colour. Gain is green, loss is red, in both apps. Ordered (unsigned) scales use steps of `--chart-1`. Categorical series use `--chart-1` to `--chart-5`; past five, fold into "Other" in `--muted-foreground`. Brokers and asset classes have no colours of their own; they are badges or series. |
| Charts | shadcn chart wrapper over Recharts: area, bar and line, with reference lines. `blue` chart preset so a series is the same colour in both schemes. TradingView Lightweight Charts for price charts, with one credit link per page. Chart colours are read from CSS variables at run time. |
| Buttons and accent | Stock: primary is black on white and white on black. Links are `--link`. |
| Layout | "A card holds data, prose sits on the page." Any data block (stat tile, table, chart, metric strip) is in a Card wherever it appears, including on a prose page; paragraphs and headings sit on the canvas. One level of card. Roomy density: the style's stock paddings. |
| Scheme | Follows `prefers-color-scheme` through Tailwind's `@custom-variant dark (@media (prefers-color-scheme: dark))`. No `.dark` class, no toggle, no boot script needed for colour; `<meta name="color-scheme" content="light dark">` only. |
| Fonts | Geist for text, Geist Mono for identifiers and chart ticks, via fontsource. Tabular figures wherever a number appears. |
| Content rules kept from 1.x | Indian grouping (`1,53,110`), compact rupees (`₹2.4L`, `₹40Cr`), IST with the zone written (`14:30 IST`), ▲ ▼ beside every signed figure, reduced motion honoured. |
| Name | Siyahi. Repo `jatinbansal1998/siyahi` (public, exists, `~/code/siyahi`). Package `@siyahi/ui` on npmjs (the `siyahi` name is free there; Jatin creates the `siyahi` org). The skill becomes `siyahi`; the `kajal` skill folder is deleted. |
| Licence | MIT. |
| Icon | `assets/icon.svg`, a single-colour mark that reads at 16px, used by the README and as the project icon in T3 Code. Designed in the package PR. |
| Public access | No tokens anywhere: the repo and the package are public. |
| Install before you write | Order of preference for any UI need: shadcn core, then a shadcn-format registry from the Directory, then composing those with props, then writing our own. Our own code is the exception and must be justified in the PR. Add-ons are pinned in `registry.lock.json` and refreshed with the CLI. |
| Releases | CI publishes a `0.x.0-next.N` pre-release to npmjs on every merge to `main` (trusted publishing from GitHub Actions, no long-lived token), so consumers never wait on a hand release. Stable versions are cut on Jatin's word. First stable is `1.0.0`; the "2.0" is Kajal's lineage, not the package version. |
| Consumers | The Book moves to React and the package, shell first, then screen by screen. dash: new pages use the package; the shell (index, search, Markdown viewer) moves too; old pages stay on Mantine with Tailwind's preflight reset left off so they are not restyled. |
| Before/after page | dash `pages/dell/2026-10-15-why-the-dell-froze.tsx` is the only existing dash page migrated, so Jatin can compare before and after. |

## The package

Contents of `~/code/siyahi`:

- `styles/siyahi.css`: Tailwind v4 entry with `@theme`, the shadcn variables for both
  schemes via the media-query dark variant, and the four added tokens. The only place a
  colour value lives. Preflight is a separate import so a consumer can leave it out.
- `components/ui/*`: shadcn core components, installed with `npx shadcn add` and taken
  as is: button, badge, card, table, tabs, toggle-group, select, input, tooltip, dialog,
  sheet, dropdown-menu, command, alert, skeleton, separator, chart, sidebar, breadcrumb,
  scroll-area, popover, calendar, slider, progress.
- `components/registry/*`: add-ons installed from shadcn-format registries, taken as is,
  pinned in `registry.lock.json` (registry, item, version). Initial set, each read once
  before install because it is third-party code:
  - `@heatmap`: GitHub-style calendar, weekday-by-hour matrix, status timeline. Its
    single-hue fade is fine for counts; signed heat uses the `color-mix` steps above.
  - A data table on TanStack Table with faceted filters, sorting and a pinned first
    column. Candidates in order: `@tablecn`, `@niko-table`, `@data-table-filters`. The
    builder picks the lightest one that runs on Base UI and Tailwind v4 without
    react-query or dnd-kit; if none fits, TanStack Table plus stock parts.
  - `@dashboardcn`: KPI card (the stat tile) and ranked list ("needs attention").
  - shadcn blocks: `sidebar-07` for the app shell (stock behaviour: drawer under 768px),
    `dashboard-01` as the reference layout, the area, bar and line chart blocks.
- `components/siyahi/*`: what no registry offers, kept thin:
  - `Delta`: signed figure with ▲ ▼, Indian grouping, `--positive`/`--negative`.
  - `PriceChart`: Lightweight Charts wrapper reading CSS variables, with the credit link.
  - `Treemap`: the holdings heat map, hand SVG on the `color-mix` heat steps.
  - `ViewerTime`: IST time with the viewer's local time in a tooltip.
  If a wrapper grows past twenty lines, look for a registry component instead.
- `lib/format.ts`: `inr`, `inrCompact`, `pct`, `ist`.
- `lint/`: rules that run only on files importing the package: no hex/rgb/oklch
  literals, no Tailwind arbitrary values for colour or size, no `dark:` variants, no
  numeric font-size props. Frozen dash pages are outside the rule by construction.
- `scripts/shots.mjs`: generalised from dash. Takes a URL, renders 1920 and 390 in light
  and dark, checks gutter, horizontal overflow and font. dash keeps a thin `npm run
  shots` that resolves its routes and calls it.
- `scripts/contrast.mjs`: the 4.5:1 check, run in the build.
- `catalogue/`: a Vite site that is the style guide. Every installed and written
  component in light and dark with the code beside it. Deployed publicly at
  `siyahi.jatinbansal.com` on Cloudflare Pages or a Worker (Claude's call on the host); no
  Access in front, since the repo is public.
- `lib/locale.ts`: one object with number locale, currency, compact units and time
  zone, defaulting to `en-IN`, `INR`, lakh/crore and `Asia/Kolkata`, so another user
  sets `en-US`, `USD`, K/M/B and their zone in one place.
- `assets/icon.svg`: the mark, also used as the favicon of the catalogue.
- `README.md` for outsiders: what it is, five-line install, how to pick a locale, how the
  lint is wired, link to the catalogue. `LICENSE` (MIT). `CHANGELOG.md`, one entry per
  version. `CONTRIBUTING.md` with the "install before you write" rule.

Borrowed from t3code: the `--check` mode so CI fails when generated output (CSS, lock
file, report CSS) is stale, and the five report layout rules below.

## Static HTML reports (dash `public/r/`)

Reports are single self-contained HTML files agents write, served as plain pages as
today. They get:

- `siyahi-report.css`, generated from the theme: the shadcn variable names on `:root`
  for light with a `prefers-color-scheme: dark` override, Geist via a font link, base
  body styles. The agent inlines it into the report at write time, so the file is a
  dated snapshot and stays self-contained. Old reports are not re-themed.
- Five layout rules in the skill text: never paint `html` or `body` beyond the base
  styles; fluid width, no outer card or banner title; a panel with its own background
  gets 16px padding and `var(--radius)`; charts get fixed pixel heights; never `100vh`.

## The skills

- A new `siyahi/SKILL.md` in agent-skills: install the package, read the catalogue, the
  ten rules below, the five report rules, the content rules. The `kajal` skill folder is
  deleted in the same change, and the README table updated.
- `dashboard-publisher/SKILL.md` is rewritten in the same change: it currently tells
  dash page agents to use Mantine, `@dash/kit`, "no boxes", `npm run kajal` and the TSX
  style guide, all of which go. `skill-maintainer/SKILL.md` drops its reference to the
  1.x `tokens.ts`.

The ten rules:

1. A card holds data, prose sits on the page. One level of card.
2. A stat tile is the registry KPI card: muted label, outline badge, value, bold line,
   muted line.
3. Charts: area, bar or line, chart tokens only, dashed horizontal grid, legend below,
   range or mode toggle top right. Fixed pixel height.
4. Tables are the registry data table, inside a Card.
5. Views switch with Tabs; secondary actions are outline buttons with an icon.
6. Four meaning colours: positive, negative, warning, link. Nothing else is coloured.
7. Notices are shadcn Alert. Red fill only for errors, amber only for warnings.
8. Stock sizes from the `base-vega` style. Geist, tabular figures. Geist Mono only for
   identifiers and ticks.
9. Indian grouping, compact rupees, IST with zone, arrows beside colour, scheme follows
   the device, reduced motion honoured.
10. On a phone: one tile per row, cards edge to edge with a 16px gutter, tables scroll
    inside their card with the first column pinned, sidebar becomes a drawer.

## Consumers

**dash.** Install the package and Tailwind without preflight. Move the shell (`main.tsx`
index, utility bar, ⌘K search via Command, footer), `MarkdownDocument.tsx`,
`markdown.css` and `MermaidDiagram.tsx` onto the package; Mermaid gets hex values
converted from the theme at build time since it cannot read `oklch()`. Keep Mantine,
`theme.ts`, `theme.css`, `legacy-theme.ts` and `ui.tsx` for the frozen pages, each with
a dated removal note ("delete when the last page importing this is deleted").
`kajal/`, the `kajal` npm script and `kit/` stay for the two remaining Kajal 1.x pages,
with the same removal note.
Rewrite the Dell page on the package; no other page. Replace
`check:page` with the package lint. Delete the TSX style guide; link to the catalogue.
Update `.oxlintrc.json`, `.oxfmtrc.json`, `knip.json` and the README UI section.

**The Book.** `dashboard/` becomes a React app on Vite with the package. PR order:
1. Shell: React `AppShell` (sidebar block, masthead with "as of" and source badges, hash
   routing, prefetch on hover) hosting the existing vanilla views through a mount
   adapter, so main stays deployable. Tailwind without preflight until the last vanilla
   view is gone.
2. Holdings. 3. Realized together with the fills modal, which it opens. 4. Cash flow.
5. Money. 6. Mutual Funds. 7. Discipline. 8. Check. 9. Remove the adapter, `styles.css`,
`web/kajal/`, and turn preflight on.
The read API and the Java backend do not change. Hand-drawn SVG charts move to the chart
wrapper; the treemap is the package `Treemap`. Demo mode (`VITE_DEMO=1`) keeps working.

**Order overall.** Package, icon, README and catalogue first; then the dash shell and the
Dell page as the before/after; then The Book; then the skills.

## How it gets built

Each unit of work (the package, the catalogue, the dash shell and Dell page, each Book
PR) runs in its own T3 Code thread on Claude Opus 5.5 at extra-high reasoning effort, in
its own git worktree, and ends in a ready-for-review PR. This thread (Fable 5.1) is the
orchestrator: it writes the brief, reviews each PR against this document and the
screenshots, and asks Jatin only when a decision changes what gets built. Nothing merges
without Jatin's word.

## Proof

Each PR carries screenshots from `shots.mjs` in both schemes at 1920 and 390, and the
lint and contrast check pass. The Book's PRs are checked against the running service on
port 9090 (`portfolio.service` on the Dell).

## Left to the builder

- Exact Tailwind config, Vite setup, package build (tsup or Vite lib mode), npm trusted
  publishing setup.
- The icon's form. Constraint: one colour, legible at 16px, works on light and dark.
- How the catalogue site organises pages.
- Which data-table registry wins, and which of its features The Book's ledgers turn on.
- Whether the KPI card needs a prop for ▲ ▼ and Indian grouping or takes `Delta` as its
  badge.
- The mount adapter for vanilla views during The Book's migration.
- Test strategy for components (likely Vitest browser mode plus the screenshot script).
