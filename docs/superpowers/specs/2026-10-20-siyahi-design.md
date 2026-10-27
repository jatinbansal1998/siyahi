# Siyahi design

Date: 2026-10-20. Author: Claude with Jatin Bansal. Status: builder-checked twice (Opus 5.5, extra-high); all findings folded in. Awaiting Jatin's go.

## In six lines

Siyahi (Hindi for ink) replaces Kajal's hand-made token system with stock shadcn/ui on
Tailwind v4 and Base UI, shipped as one public package, `@siyahi/ui`, that dash and The
Book (the transactions analyser) install and anyone else may use. The look is shadcn's default neutral theme in the `base-luma` style, with four
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
| shadcn style | `base-luma` (24px card padding, 14px body, `rounded-4xl` cards with `shadow-md`, pill buttons, `p-3` table cells). Jatin chose luma over `base-vega` after a side-by-side trial (0.1.5); Mira is the compact style. Stock sizes from the style; no Kajal size table. |
| Theme values | shadcn default `neutral`, stock values, both schemes. Dark canvas `oklch(0.145 0 0)`, which is `#0a0a0a`, the value Kajal 1.0.2 already settled on. |
| Added tokens | `--positive`, `--negative`, `--warning`, `--link`, each with a `-foreground` where a fill needs one. Values start from Tailwind green, red, amber and blue and are adjusted per scheme until text passes 4.5:1 on the canvas and on the card. Nothing else. |
| Contrast | 4.5:1 for any text colour on canvas and card; 3:1 for each chart slot against the card and against the slots next to it (adjacent slots only; see Chart palette). Checked by a script in the package build. The check fails the build; values are fixed, never the bar. |
| Graded colour | Heat maps and signed scales use `color-mix()` steps of `--positive` and `--negative` toward the card colour. Gain is green, loss is red, in both apps. Ordered (unsigned) scales use steps of `--chart-1`. Categorical series use `--chart-1` to `--chart-5`; past five, fold into "Other" in `--muted-foreground`. Brokers and asset classes have no colours of their own; they are badges or series. |
| Chart palette | Five distinct hues, the same hue order in both schemes (blue, emerald, amber, violet, rose), one lightness step apart between schemes so each passes 3:1 on its card. Adjacent slots, and each slot against the card, reach 3:1. Five hues cannot all be pairwise 3:1 against each other and the card through lightness alone, so the palette alternates light and deep (emerald and violet are deep) and non-adjacent slots are told apart by hue. Series therefore take slots in order. Every chart value is inside sRGB so the browser paints what the script scored. shadcn's single-hue `blue` preset was measured at 1.3 to 1.8:1 between neighbours and is rejected. (Claude's call; adjacent-only rule confirmed by the orchestrator after review round 1.) |
| Charts | `AreaChartCard`, `BarChartCard` and `LineChartCard`, from shadcn's new-york-v4 chart blocks (none exist for the base styles) over shadcn's `chart` component: a page passes rows, the x axis field and the series, and the card owns the axes, grid, tooltip and legend (0.1.8, after dash#88 gave its category axis its own id and broke the tooltip). A zero line draws when a value goes below zero. Props add a footer, a placeholder, labelled reference lines, a numeric x axis, fixed value axis, axis titles, two-line ticks, sign colours, a picked category and sideways bars (0.1.8, for the Dell page and The Book). `DistributionBar` (dashboardcn) draws one stacked bar on a fixed scale with limit markers. Range and mode toggles use ToggleGroup. TradingView Lightweight Charts for price charts, with one credit link per page. Chart colours are read from CSS variables at run time. |
| Buttons and accent | Stock: primary is black on white and white on black. Links are `--link`. |
| Layout | "A card holds data, prose sits on the page." Any data block (stat tile, table, chart, metric strip) is in a Card wherever it appears, including on a prose page; paragraphs and headings sit on the canvas. One level of card. Roomy density: the style's stock paddings. |
| Scheme | Follows `prefers-color-scheme` through Tailwind's `@custom-variant dark (@media (prefers-color-scheme: dark))`. No `.dark` class, no toggle, no boot script; `<meta name="color-scheme" content="light dark">` only. The README says an app that wants its own toggle must swap the variant. |
| CSS reset | Tailwind preflight stays on in both apps. Old CSS is placed in a cascade layer between Tailwind's `base` and `components` so preflight does not strip it and Siyahi utilities still win: dash uses `@layer kajal, theme, base, mantine, components, utilities` with Mantine through `styles.layer.css`; The Book uses `@layer theme, kajal, base, legacy, components, utilities` with `styles.css` imported into `legacy`. Putting the old CSS below `base` was tried and collapses the old components. A layer name used by an imported file must appear in the order statement (or be nested by `@import … layer(name)`), or it floats above everything. Frozen pages may drift from the reset; that is accepted. |
| Fonts | Geist for text, Geist Mono for identifiers and chart ticks, via fontsource. Tabular figures wherever a number appears. |
| Content rules kept from 1.x | Indian grouping (`1,53,110`), compact rupees (`₹2.4L`, `₹40Cr`), IST with the zone written (`14:30 IST`), ▲ ▼ beside every signed figure, reduced motion honoured. |
| Name | Siyahi. Repo `jatinbansal1998/siyahi` (public, exists, `~/code/siyahi`). Package `@siyahi/ui` on npmjs (the `siyahi` name is free there; Jatin creates the `siyahi` org). The skill becomes `siyahi`; the `kajal` skill folder is deleted. |
| Licence | MIT. |
| Icon | `assets/icon.svg`, a single-colour mark that reads at 16px, used by the README and as the project icon in T3 Code. Designed in the package PR. |
| Public access | The repo and the package are public; installing needs no token. Publishing needs none either: npm trusted publishing lets `publish.yml` publish through GitHub's OIDC identity. The catalogue deploys from the Dell with the wrangler login already there, the way dash does, so no Cloudflare token goes into GitHub. |
| Install before you write | Order of preference for any UI need: shadcn core, then a shadcn-format registry from the Directory, then composing those with props, then writing our own. Our own code is the exception and must be justified in the PR. |
| Editing installed code | shadcn core files are never edited, so `shadcn add --overwrite` can refresh them. Registry add-ons are copied once and then owned: each file keeps a header with its origin URL, licence and the content hash of what was copied; edits are allowed; there is no refresh tooling and CI never fails on upstream changes. `registry.lock.json` records origin and hash. Blocks with sample data (sidebar, dashboard layout) are treated as add-ons. |
| Releases | CI publishes a `0.x.0-next.N` pre-release to npmjs with `--tag next` on every merge to `main`, through npm trusted publishing (OIDC, no stored token). Consumers install `@siyahi/ui@next` until `1.0.0`. Stable versions are cut on Jatin's word. |
| Consumers | The Book moves to React and the package, shell first, then screen by screen. dash: new pages use the package; the shell moves too; old pages stay on Mantine under the layered stylesheet. |
| dash shell | Keeps today's shape, rebuilt on the package: index page with folders and recent items, top utility bar with title, ⌘K search (Command) and width toggle, footer. No sidebar; dash is a reports site, and a sidebar would take 256px from 56 frozen pages. (Claude's call.) |
| Stat tile | shadcn's own `SectionCards` from the `dashboard-01` block (copied from base-vega, drawn as a stock luma Card: 26px corners, `shadow-md`; flat cards were tried for 0.1.6 and Jatin kept the default): muted label, outline badge top right, value, bold line, muted line. `@dashboardcn`'s KPI card is dropped: it uses a Radix-only prop, hard-codes emerald and red, and formats as en-US. |
| Before/after page | dash `pages/dell/2026-10-15-why-the-dell-froze.tsx` is the only existing dash page migrated, so Jatin can compare before and after. |

## The package

Contents of `~/code/siyahi`:

- `styles/siyahi.css`: Tailwind v4 entry with `@theme`, the shadcn variables for both
  schemes via the media-query dark variant, the four added tokens and the chart
  palette. The only place a colour value lives. shadcn's `tailwind.css` is copied into
  the build so the `shadcn` CLI is not a runtime dependency.
- `components/ui/*`: shadcn core components, installed with `npx shadcn add` and taken
  as is: button, badge, card, table, tabs, toggle-group, select, input, tooltip, dialog,
  sheet, dropdown-menu, command, alert, skeleton, separator, chart, sidebar, breadcrumb,
  scroll-area, popover, calendar, slider, progress, accordion.
- `components/registry/*`: add-ons installed from shadcn-format registries, taken as is,
  pinned in `registry.lock.json` (registry, item, version). Initial set, each read once
  before install because it is third-party code:
  - `@heatmap`: GitHub-style calendar, weekday-by-hour matrix, status timeline. Its
    single-hue fade is fine for counts; signed heat uses the `color-mix` steps above.
  - A data table on TanStack Table with faceted filters, sorting and a pinned first
    column. Candidates in order: `@tablecn`, `@niko-table`, `@data-table-filters`. The
    builder picks the lightest one that runs on Base UI and Tailwind v4 without
    react-query or dnd-kit; if none fits, TanStack Table plus stock parts.
  - `@dashboardcn` ranked list ("needs attention"), if its licence is clear; otherwise a
    twenty-line composition of Table.
  - shadcn chart blocks `chart-bar-multiple`, `chart-area-stacked` and
    `chart-line-multiple`, made into `BarChartCard`, `AreaChartCard` and
    `LineChartCard` with data props (0.1.8).
  - shadcn blocks: `sidebar-07` for The Book's app shell (stock behaviour: drawer under
    768px) and `dashboard-01` for `SectionCards` and the reference layout, both with
    their sample data removed.
  Before any add-on is copied: read it, confirm a licence that allows copying (MIT or
  similar), record it in `THIRD_PARTY_NOTICES.md`. No clear licence, no copy.
- `components/siyahi/*`: what no registry offers, kept thin:
  - `Delta`: signed figure with ▲ ▼ in the configured locale, `--positive`/`--negative`.
  - `PriceChart`: Lightweight Charts wrapper reading CSS variables, with the credit link.
  - `Treemap`: the holdings heat map, hand SVG on the `color-mix` heat steps.
  - `LocalTime`: a time in the configured zone with the viewer's local time in a tooltip.
  - `SiyahiProvider`: React context carrying the locale settings below.
  If a wrapper grows past twenty lines, look for a registry component instead.
- `lib/format.ts`: `money`, `moneyCompact`, `pct`, `time`, all reading the provider's
  locale. Neutral names; nothing in the API says India.
- A second workspace package, `@siyahi/tools`, so strangers installing `@siyahi/ui` do
  not pull Playwright or a linter:
  - `lint/`: rules that run only on files importing `@siyahi/ui`: no hex/rgb/oklch
    literals, no Tailwind arbitrary values for colour or size, no `dark:` variants, no
    numeric font-size props. Frozen dash pages are outside the rule by construction.
  - `shots.mjs`: generalised from dash. Takes a URL, renders 1920 and 390 in light and
    dark, checks gutter, horizontal overflow, content cut off by an overflow-hidden box, and font. dash keeps a thin `npm run shots`
    that resolves its routes and calls it.
  - `contrast.mjs`: the 4.5:1 text and 3:1 chart checks, run in the `@siyahi/ui` build.
- `catalogue/`: a Vite site that is the style guide. Every installed and written
  component in light and dark with the code beside it. Deployed publicly at
  `siyahi.jatinbansal.com` on Cloudflare Pages or a Worker (Claude's call on the host); no
  Access in front, since the repo is public.
- `lib/locale.ts`: the settings type for `SiyahiProvider`: number locale, currency and
  time zone, defaulting to `en-IN`, `INR` and `Asia/Kolkata`. `Intl` with `en-IN` already
  yields lakh and crore, so no compact-unit setting is needed. Another user passes
  `en-US`, `USD` and their zone to the provider.
- `assets/icon.svg`: the mark, also used as the favicon of the catalogue.
- `README.md` for outsiders: what it is, five-line install (`@siyahi/ui@next` until
  1.0), how to pick a locale, how the lint is wired, that dark mode follows the device
  unless the variant is swapped, link to the catalogue. `LICENSE` (MIT),
  `THIRD_PARTY_NOTICES.md`. `CHANGELOG.md`, one entry per version. `CONTRIBUTING.md`
  with the "install before you write" and "never edit shadcn core" rules.

Borrowed from t3code: the `--check` mode so CI fails when generated output (CSS, lock
file, report CSS) is stale, and the five report layout rules below.

## Static HTML reports (dash `public/r/`)

Reports are single self-contained HTML files agents write, served as plain pages as
today. They get:

- `report.css`, generated from the theme: the shadcn variable names on `:root` for
  light with a `prefers-color-scheme: dark` override, a system font stack with Geist
  first if the viewer has it (no font link, no external request, which the market-flow
  skill already requires), base body styles. The agent inlines it at write time from
  the installed skill folder (`~/.agents/skills/siyahi/report.css`, copied from the
  package by `install.sh`), so the report is a dated snapshot and self-contained. Old
  reports are not re-themed.
- Five layout rules in the skill text: never paint `html` or `body` beyond the base
  styles; fluid width, no outer card or banner title; a panel with its own background
  gets 16px padding and `var(--radius)`; charts get fixed pixel heights; never `100vh`.

## The skills

- A new `siyahi/SKILL.md` in agent-skills: install the package, read the catalogue, the
  ten rules below, the five report rules, the content rules. The `kajal` skill folder is
  deleted in the same change, and the README table updated.
- `dashboard-publisher/SKILL.md` and dash's `scripts/new-page.mjs` scaffold change in
  the dash PR, not at the end, or every page made in between is Mantine. The skill
  currently prescribes Mantine, `@dash/kit`, "no boxes", `npm run kajal` and the TSX
  style guide. `skill-maintainer/SKILL.md` drops its reference to the 1.x `tokens.ts`.
  The market-flow skill (`~/code/market-flow`) is pointed at `report.css`.
- `install.sh` gains an uninstall step that removes `~/.agents/skills/kajal` and its
  `~/.claude/skills/kajal` link, so the old skill stops triggering.

The ten rules:

1. A card holds data, prose sits on the page. One level of card.
   A stat tile is a Card like any other: no gradient, no extra shadow. Every
   card keeps luma's own `shadow-md` and ring (flat cards were tried in 0.1.6;
   the default stayed).
2. A stat tile is `SectionCards` from shadcn's dashboard block: muted label, outline
   badge, value, bold line, muted line.
3. Charts: `AreaChartCard`, `BarChartCard` or `LineChartCard` (0.1.8), chart tokens
   only, dashed horizontal grid, legend below, range or mode toggle top right. Fixed
   pixel height. Ranked categories are `BarList`. On a card whose header is
   narrower than 24rem (a phone), the theme puts the toggle under the title and
   description, left-aligned; a stat tile's lone badge stays top right (0.1.7).
4. Tables are the registry data table, inside a Card.
5. Views switch with Tabs; secondary actions are outline buttons with an icon.
6. Four meaning colours: positive, negative, warning, link. Nothing else is coloured.
   Categories stay neutral: a sector, a broker or a unit's kind is an outline
   Badge, never tinted from a chart hue (tried in 0.1.6, not taken).
7. Notices are shadcn Alert, used as shipped: default for information, destructive for
   errors. Warnings are the default variant with an amber icon.
8. Stock sizes from the `base-luma` style. Geist, tabular figures. Geist Mono only for
   identifiers and ticks.
9. Indian grouping, compact rupees, IST with zone, arrows beside colour, scheme follows
   the device, reduced motion honoured.
10. On a phone: one tile per row, cards edge to edge with a 16px gutter, tables scroll
    inside their card with the first column pinned, sidebar becomes a drawer.

## Consumers

**dash.** Install the package with preflight on; switch Mantine to `styles.layer.css`
and declare the layer order. Move the shell (`main.tsx` index, utility bar, ⌘K search
via Command, footer), `MarkdownDocument.tsx`, `markdown.css` and `MermaidDiagram.tsx`
onto the package; Mermaid gets hex values converted from the theme at build time since
it cannot read `oklch()`. Keep Mantine,
`theme.ts`, `theme.css`, `legacy-theme.ts` and `ui.tsx` for the frozen pages, each with
a dated removal note ("delete when the last page importing this is deleted").
Delete the `kajal` npm script (its source folder is going). `kajal/` and `kit/` stay
for the one remaining Kajal 1.x page (product-ideas), trimmed to the four kit exports it
uses so `knip` passes, with the same removal note.
Rewrite the Dell page on the package; no other page. Keep
`check:page` (it is the only check that catches a page with no default export) and
swap its Kajal regular expressions for the `@siyahi/tools` lint. Delete the TSX style guide; link to the catalogue from the index.
Update `.oxlintrc.json`, `.oxfmtrc.json`, `knip.json` and the README UI section.

**The Book.** `dashboard/` becomes a React app on Vite with the package. PR order:
1. Shell: React `AppShell` (sidebar block, masthead with "as of" and source badges, hash
   routing, prefetch on hover) hosting the existing vanilla views through a mount
   adapter, so main stays deployable. `styles.css` wrapped in `@layer legacy` until the last
   vanilla view is gone.
2. Holdings. 3. Realized together with the React fills modal; the old Check view opens
the React modal through the adapter from this PR on, so one modal exists. 4. Cash flow.
5. Money. 6. Mutual Funds. 7. Discipline. 8. Check. 9. Remove the adapter, `styles.css`,
`web/kajal/` and the `legacy` and `kajal` layers.
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

- Exact Tailwind config, Vite setup, workspace layout for `@siyahi/ui` and
  `@siyahi/tools`, package build (tsup or Vite lib mode), the publish workflow.
- The icon's form. Constraint: one colour, legible at 16px, works on light and dark.
- How the catalogue site organises pages.
- Which data-table registry wins, and which of its features The Book's ledgers turn on.
- How `Delta` sits in `SectionCards`' badge slot.
- The mount adapter for vanilla views during The Book's migration.
- Test strategy for components (likely Vitest browser mode plus the screenshot script).
