---
name: siyahi
description: >-
  Build coherent React UI and self-contained pages with @siyahi/ui. Use when
  using Siyahi, asking for house style, or building data-heavy pages
  in a project that uses the package.
---

# Siyahi

Siyahi is shadcn/ui on Base UI and Tailwind CSS, with a shared theme,
charts, tables and formatters. Source: https://github.com/jatinbansal1998/siyahi.
Catalogue: https://siyahi.jatinbansal.com.
Installation: https://github.com/jatinbansal1998/siyahi#for-agents.

## Select before writing

1. From the consuming app, run `npm ls @siyahi/ui @siyahi/tools` to find its
   installed versions. For a new app, run `npm view @siyahi/ui dist-tags.next`
   and pin that exact version, without a caret, for both packages.
2. Read the installed `@siyahi/ui/agents/manifest.json`. Paths in it are relative
   to the package directory, normally `node_modules/@siyahi/ui`. Search its
   `needs` for the task, then match `components` against the `examples` index.
   Read only the selected example files. `recipes` points to existing
   compositions for larger tasks. Read the installed README's Install section
   when setting up the app, and Surfaces when choosing page treatment.
3. Follow the examples' imports and composition. Exact prop types are in
   `dist/index.d.ts`; follow its re-exports to the component's declaration.
   Do not invent props from memory or copy old consumer pages.
4. For an older package without the manifest, use its README's **Which
   component** table. Upgrade only if the task needs a missing capability;
   read the selected version's changelog before changing an existing pin.

If the package is not installed, fetch the chosen version with
`npm pack @siyahi/ui@<version>` into a temporary directory and extract the
tarball there. Read its README for setup, then the same manifest and examples.
The package is the authority for the installed version; the skill carries no
component inventory. Do not depend on a local Siyahi checkout or another skill.

## Coherence with freedom

Use the package for controls, charts, tables, numerical formatting and theme.
Choose the page's hierarchy, arrangement, narrative and interactions to fit the
task. Recipes are editable compositions, not a mandatory page schema. Custom
layouts and product-specific logic belong in the consuming app.

- Prefer existing components and their props, slots and children. Use
  `className` for layout; keep colours and typography on the theme.
- Charts use the chart cards and their supported props, not page-local
  Recharts axes, grids or tooltips. Match charts to the manifest's `needs`.
- Use semantic colour tokens; categories remain neutral. No gradients. Ink
  indigo lives in `link`, the sidebar's selected item and `chart-1`; place
  it, do not spread it. Buttons, badges, toggles and focus stay monochrome.
  Numbers use `useFormat()`, changes use `Delta`; do not replace the formatters
  with bare `toLocaleString()`. Prose uses `max-w-prose`.
- Follow the installed `DESIGN.md` (`node_modules/@siyahi/ui/DESIGN.md`)
  before designing or changing UI: its rules on colour, emphasis, surfaces,
  shape, labels and words are binding. In short, colour carries meaning and emphasis
  tints the whole box (`StatusAlert`, `StatusBadge`, `Callout`, `Quote`), never
  a stripe down one side. A page is ruled on white by default: set no surface
  unless the page is a set of separate blocks (`surface="card"`), and add no
  rounded corners, shadows or gaps of your own between data blocks.
- The installed README owns surfaces, chart colours, locale and dark mode.
  Include `<meta name="color-scheme" content="light dark">` in app HTML.
  Follow the package's reduced-motion behaviour; JavaScript-started motion
  checks `matchMedia("(prefers-reduced-motion: reduce)")` too.
- If an app overrides font stacks, keep `"Geist Fallback"` and
  `"Geist Mono Fallback"` immediately after their respective Geist fonts.
  A sticky page header over a table needs only `z-1`; the table isolates its
  internal stacking.
- Include relevant loading, empty and error states. Use the package parts
  available in the installed version and do not invent an unsupported `status`
  prop. Explain units and unfamiliar labels in the page.
- A wide table marks the columns that answer its question with `meta.compact`
  and puts `DataTableCompactColumnsToggle` in its toolbar: when its columns do
  not fit, on a phone or a laptop, the rest hide rightmost first instead of
  scrolling the answer out of view.

When reusable UI behaviour is missing, add it to Siyahi rather than recreating
it in each app. Read the source repository's CONTRIBUTING.md: shadcn first,
then a registry item, then composition, then our own component. Leave shadcn
core unedited. Follow the repository's release instructions, then update the
consumer to the exact published version. This applies to missing shared
components or capabilities, not to an original arrangement of existing parts.

## Verify

Read the installed `@siyahi/tools/README.md` for lint configuration and command
flags. Run the consuming project's checks, then `npx --no-install siyahi-shots` against its
built page. Open every generated image, including page segments, in light and
dark at laptop and phone widths. Screenshots prove layout, not interactions:
exercise changed controls and tooltips with `siyahi-shots --script`, which runs
your Playwright steps in every mode, prints what they return and lets them take
the interaction's picture, instead of a one-off Playwright script.

After changing fonts, loading state or content above the fold, run
`npx --no-install siyahi-cls` against the build or deployed page, not a development server.

To host or hand over one page as a single file, build it with
`npx --no-install siyahi-page <page.tsx>`; check it first with
`npx --no-install siyahi-shots <page.tsx>`. The build frames the page with
the house gutter, so the page sets no padding and no `<main>` of its own.
