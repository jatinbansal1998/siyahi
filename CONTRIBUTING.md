# Contributing

## Install before you write

For any UI need, take the first of these that works:

1. A shadcn/ui component: `pnpm --filter @siyahi/ui exec shadcn add <name>`.
2. An item from a shadcn-format registry in the
   [directory](https://ui.shadcn.com/r/registries.json).
3. A composition of those with props, shown in the catalogue.
4. Our own component in `packages/ui/src/components/siyahi`, kept under about
   60 lines. Say in the pull request why nothing above would do.

## Never edit shadcn core

Files in `packages/ui/src/components/ui` and `src/hooks/use-mobile.ts` are
exactly what `shadcn add` wrote. They are not formatted or linted, so
`shadcn add --overwrite <name>` can refresh them at any time. To change how a
component looks, change the theme; to change what it does, compose it.

## Registry add-ons

An add-on from a third-party registry is copied once and then ours to edit.
Before copying, read the code and confirm a licence that allows it (MIT or
similar). No clear licence, no copy. Then:

1. Install it with the shadcn CLI into a scratch project whose `components.json`
   aliases match `packages/ui/components.json`, and move the files under
   `packages/ui/src/components/registry/<source>/`.
2. Start each file with this header, where the hash is the SHA-256 of the file
   as the CLI wrote it (`sha256sum file`):

   ```
   // Registry: @<registry>/<item>
   // Origin: <item JSON URL>
   // Licence: <licence>, Copyright (c) <holder>, <licence URL>
   // Copied: <YYYY-MM-DD>, sha256 <hash>
   ```

3. Mark every edit with a `// Siyahi edit:` line saying what changed and why.
   `pnpm generate:check` fails when a file differs from the copy its header
   hashes and has no such line.
4. Add the origin to `THIRD_PARTY_NOTICES.md` and run `pnpm generate`, which
   rewrites `registry.lock.json` and the `@siyahi/ui` barrel.

## Stacking

A part a component lifts with a z-index (a button laid over a tile, a sticky
header, a badge) must rank only inside its component, never against a page's
sticky header or section strip, which are z-10 too. Add the component's root
slot to the `isolation: isolate` list in `siyahi.css` (for a part that must
sit over a neighbour, such as an avatar's badge in a group, the group's slot), and its page to
`apps/catalogue/test/page-chrome.test.tsx`, which fails on any lifted part
outside such a root.

## Charts

Give every chart series its colour as a chart token in the config:
`{ label: "Value", color: "var(--chart-1)" }`. Never use the config's
`theme: { light, dark }` map: shadcn's `chart.tsx` (core, not edited) writes the
dark half under a `.dark` class, which Siyahi never sets, so dark mode would show
the light colour. The variable already follows the scheme. The lint rule
`siyahi/no-chart-theme-map` rejects the map. Series take the slots
`--chart-1` to `--chart-5` in order: neighbouring slots differ by lightness,
slots two apart only by hue.

## Colours and sizes

`packages/ui/styles/siyahi.css` is the only file that holds a colour value.
Light values sit in `:root`; dark values sit in the `@variant dark { … }`
block inside it, and every token the checks read must be set there too.
`packages/tools/contrast.mjs` checks every pair in the build, on the canvas and
the card alike, with a translucent fill (`bg-muted/50`, `bg-destructive/20`)
blended over the surface under it as the browser paints it: 4.5:1 for text on
the page, on its own fill, and on every tint the components put it on (muted
text on Callout, StatusAlert, StatusBadge and Quote washes and code-line fills, destructive
text on its tint at rest and on hover, the command placeholder, treemap labels
on every heat step); 3:1 for a field's edge (`--input`) against the page and its
own fill, the focus ring (against the page, the card, a tab list and the
sidebar around a control, and its inner page-colour ring against a primary
fill), a selected tab against its list, and chart and
meaning colours against the page and the slots next to them, a waterfall's
gain and loss edges against their own tint, every chart colour against the
40% band a chart card lays behind a hovered category, and a StatusHeatmap's
degraded and critical days against a healthy one. Every colour must
sit inside sRGB. When a component paints a token on a new fill, add the pair to
`PAIRS` there. When a check fails, change the value, never the bar.

An icon in an `Alert` takes its meaning colour with Tailwind's important
modifier: `<TriangleAlertIcon className="text-warning!" />`. `alert.tsx` sets
its icons to the text colour with a selector that outranks a plain
`text-warning`, and core is not edited, so the `!` is what makes the icon amber.

Registry add-ons are not formatted or style-linted, but `pnpm lint:registry`
runs the colour rules on them, so an add-on default must name a token.

## Changing the palette

A new palette is an edit to `packages/ui/styles/siyahi.css` alone, as long as
it keeps the same roles. Set every value in both blocks, as `oklch()`.

- **The accent** is three tokens that move together: `--link`,
  `--sidebar-accent-foreground` and `--chart-1`. `--ring` and `--sidebar-ring`
  are focus, in the text colour, not the accent. `--accent` is shadcn's
  neutral hover fill, not the brand colour; leave it grey.
- **Chart slots** keep their order and their lightness pattern: each reaches
  3:1 against the page and the slot next to it, so a new hue usually needs its
  lightness tuned, not just its hue swapped.
- **Heat steps** are `--heat-1` to `--heat-5`, the share of `--positive` or
  `--negative` each step mixes into the card, light and dark apart. Treemap,
  ChangeGrid, a signed CalendarHeatmap and the contrast check all read them.
- **Tints that stay in components** (a signed bar's 35% interior, Callout and
  StatusAlert washes in `lib/tone.ts`) are shares, not colours, so they follow
  a new palette; a change to one of those shares also needs its pair in
  `packages/tools/contrast.mjs` updated.

Then run `pnpm check`: a failing pair names both colours and its ratio, and
the fix is the value, never the bar. Run `pnpm generate` for `report.css`.
Update the hue names in `DESIGN.md`, the catalogue's Foundations page and
`skills/siyahi/SKILL.md`, release, and rebuild the apps. A static report already
sent keeps the stylesheet it was built with.

## Before a pull request

The public agent skill is owned here, at `skills/siyahi/SKILL.md`. Keep workflow
there and component facts in the package. `pnpm generate` builds
`agents/manifest.json` from `packages/ui/agent-needs.json` and copies catalogue
examples into the package; edit those sources, never the generated files.
Catalogue examples must work from their shipped folder without a checkout of
this repository. Keep exact props in the TypeScript declarations rather than
duplicating them in the skill. Test skill discovery with
`npx skills add . --list` and install branch changes only in a temporary home.
Use `tests/skills/siyahi/cases.json` for independent behavioral reviews: answer from
the skill and its references, then compare against the expected decisions.

```sh
pnpm check
pnpm --filter @siyahi/catalogue build && pnpm --filter @siyahi/catalogue preview
pnpm shots http://localhost:4173/#/data   # in another shell
pnpm shots http://localhost:4173/#/data/bar-chart --script hover.mjs
```

To check a control, hover or tooltip, give `pnpm shots` a `--script` (see
`packages/tools/README.md`) rather than writing a Playwright script.

`pnpm check` formats, lints (including the colour pass over the add-ons),
looks for unused code, fails on stale generated files, builds (with the
contrast check), typechecks and tests. While you work, run the tests you are
changing (`pnpm test packages/ui/test/format.test.ts`) and `pnpm check:static`,
which is every check but the tests; run the full `pnpm check` once before the
pull request. It takes about four minutes: start it as a background job and let
your host tell you when it ends, rather than polling it with `sleep`.

Tests under `packages/` start no catalogue server, so one of them runs in
seconds. A component test that needs no real browser belongs there, in
happy-dom, and imports the component's own file, not `@siyahi/ui`: the barrel
loads every component, which costs each run several seconds
(`barrel.test.ts` checks the public exports). The catalogue suites open the
catalogue in a browser and fail on any page or console error; no tool can tell
which of them a source change reaches, so the full run is the proof. Put the shots
for every page you changed in the pull request, light and dark, 1920 and 390.

## Releases

Merges to `main` run checks without publishing. Release a completed batch with
`.agents/skills/release/SKILL.md`, which starts the manual Publish workflow.
