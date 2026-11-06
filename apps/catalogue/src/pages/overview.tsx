import { ArrowRightIcon, HouseIcon } from "lucide-react";
import { Button, InlineCode } from "@siyahi/ui";
import { Code } from "../code";
import type { Page } from "../page";

const RULES = [
  "A panel holds data, prose sits on the page. By default a data block is a card raised off the faintly tinted canvas; a ruled surface takes the box off and parts blocks with hairlines in a PanelGrid. One level of panel.",
  "A stat tile is SectionCards from shadcn's dashboard block: muted label, outline badge, value, bold line, muted line. Many figures of equal weight go in one MetricStrip instead.",
  "Charts are AreaChartCard, BarChartCard or LineChartCard: chart tokens only; the card draws the dashed horizontal grid, the tooltip and the legend below; a range or mode toggle goes top right as its action. Fixed pixel height. Ranked categories are BarList.",
  "Tables are the registry data table, inside a Card.",
  "Views switch with Tabs; secondary actions are outline buttons with an icon.",
  "Ink indigo is placed, not spread: links, focus rings, the selected sidebar item and the first chart series. Three meaning colours, positive, negative and warning, carry gains, losses and caution. Buttons, badges and toggles stay black and white.",
  "Notices are shadcn Alert, used as shipped: default for information, destructive for errors. Warnings are the default variant with an amber icon, coloured text-warning! (the ! outranks Alert's own icon colour).",
  "Stock sizes from the base-nova style: 16px panels, 36px table rows. Geist, tabular figures. Geist Mono only for identifiers and ticks.",
  "Indian grouping, compact rupees, IST with zone, arrows beside colour, scheme follows the device, reduced motion honoured.",
  "On a phone: one tile per row, cards edge to edge with a 16px gutter, tables hide columns that do not fit, never their meta.compact ones, behind an All columns toggle, sidebar becomes a drawer.",
];

const START: [href: string, title: string, use: string][] = [
  ["#/foundations", "Foundations", "Colours, type, spacing and surfaces: the tokens every page names."],
  ["#/components", "Components", "Buttons, badges, cards, tabs and the other shadcn parts, as shipped."],
  ["#/inputs", "Inputs and overlays", "Forms, menus, dialogs and sheets."],
  ["#/layout", "Page layout", "Sections, headings, facts and code in a long page."],
  ["#/data", "Data", "Charts, tables, stat tiles and heat maps for numbers."],
  ["#/blocks", "Blocks", "Whole compositions to start a dashboard from."],
  ["#/reports", "Reports", "A self-contained HTML report without React."],
];

const INSTALL = `npm install @siyahi/ui@next tailwindcss @tailwindcss/vite
npm install --save-dev @siyahi/tools@next

// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import { preloadFonts } from "@siyahi/tools/vite";
export default defineConfig({ plugins: [react(), tailwindcss(), preloadFonts()] });

/* src/index.css */
@import "@siyahi/ui/styles.css";

// src/main.tsx
import "./index.css";
import { SiyahiProvider } from "@siyahi/ui";
createRoot(root).render(<SiyahiProvider><App /></SiyahiProvider>);`;

const LOCALE = `<SiyahiProvider locale={{ numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" }}>
  <App />
</SiyahiProvider>`;

const LINT = `npm install --save-dev @siyahi/tools@next oxlint

// .oxlintrc.json
{
  "jsPlugins": ["@siyahi/tools/lint"],
  "settings": { "shadcn": { "ui": "@siyahi/ui", "themeImports": ["^@siyahi/ui/"] } },
  "rules": {
    "siyahi/no-color-literal": "error",
    "siyahi/no-scheme-variant": "error",
    "siyahi/no-numeric-font-size": "error",
    "siyahi/no-chart-theme-map": "error",
    "siyahi/no-raw-colors": "error",
    "siyahi/no-arbitrary-values": "error"
  }
}`;

const SCHEME = `/* After the @siyahi/ui import: tokens and dark: utilities then follow a .dark class on <html>. */
@custom-variant dark (&:where(.dark, .dark *));`;

// The catalogue's ink drop, the same path as its icon.
const DROP =
  "M8 .5C8 .5 2.5 6.3 2.5 10a5.5 5.5 0 0 0 11 0C13.5 6.3 8 .5 8 .5ZM4.75 10A3.25 3.25 0 0 0 8 13.25v-1.5A1.75 1.75 0 0 1 6.25 10Z";

/** The front page's introduction: the name large, what it is in one line, and the two places a reader goes next. */
function Hero() {
  return (
    <header className="relative isolate flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card px-6 py-8 sm:px-10 sm:py-10">
      {/* The ink drop as a watermark in the accent: the page's one large mark of identity, faint enough to read over. */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="absolute -top-8 -right-10 -z-10 size-80 text-chart-1 opacity-10 sm:-top-12 sm:right-4"
      >
        <path fill="currentColor" fillRule="evenodd" d={DROP} />
      </svg>
      <p className="font-mono text-xs text-link">@siyahi/ui</p>
      <h1 className="text-5xl font-semibold tracking-tighter sm:text-6xl">Siyahi</h1>
      <p className="max-w-xl text-lg text-pretty">
        Ink for numbers. A design system for pages people read figures from: portfolios, ledgers, research.
      </p>
      <p className="max-w-xl text-pretty text-muted-foreground">
        Stock shadcn/ui on Base UI and Tailwind v4, with a finance theme, charts and tables that fit a phone,
        Indian-aware formatters, a lint, and this catalogue. Siyahi is Hindi for ink.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button render={<a href="#/data" />}>
          Browse the data components
          <ArrowRightIcon />
        </Button>
        <Button variant="outline" render={<a href="#/overview/install" />}>
          Install
        </Button>
      </div>
    </header>
  );
}

export const overview: Page = {
  id: "overview",
  title: "Siyahi",
  icon: <HouseIcon />,
  lead: "Siyahi (Hindi for ink) is stock shadcn/ui on Base UI and Tailwind v4, shipped as @siyahi/ui with a finance theme, a few compositions, locale-aware formatters, a lint and this catalogue.",
  hero: <Hero />,
  // Overview is the front page: a live dashboard and the setup, read top to bottom.
  layout: "stack",
  families: [
    {
      id: "at-a-glance",
      title: "At a glance",
      lead: "A page built from the package: a metric strip, a chart card and a data table, all live.",
      examples: [
        {
          name: "overview-dashboard",
          caption: "Every figure here is drawn by the package; open the source to copy it.",
        },
      ],
    },
    {
      id: "start",
      title: "Start here",
      lead: "Where a developer goes for a task, before the setup details.",
      body: (
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {START.map(([href, title, use]) => (
            <li key={href} className="flex flex-col">
              <a href={href} className="font-medium text-link">
                {title}
              </a>
              <span className="text-sm text-muted-foreground">{use}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "install",
      title: "Install",
      lead: "Pre-1.0 releases are published under the next tag. The app needs React 19 and Tailwind v4 with the Tailwind Vite plugin: the stylesheet is Tailwind source, so without the plugin every component is unstyled. A Next.js app uses @tailwindcss/postcss instead.",
      body: (
        <>
          <Code>{INSTALL}</Code>
          <p className="max-w-prose">
            Everything comes from one import path, <InlineCode>@siyahi/ui</InlineCode>, including the chart cards. Add
            lucide-react only if your own code imports icons.
          </p>
          <p className="max-w-prose">
            <InlineCode>preloadFonts()</InlineCode> has the built page fetch Geist with its scripts rather than after
            the first paint. Until Geist arrives the theme draws Arial scaled to Geist&apos;s metrics, so nothing moves
            when it swaps in.
          </p>
        </>
      ),
    },
    {
      id: "locale",
      title: "Locale",
      lead: "Numbers, money and times default to en-IN, INR and Asia/Kolkata: 1,53,110, ₹2.4L, 14:30 IST. In an Indian-region locale moneyCompact prints amounts under one lakh in full (₹99,999), never as K. Pass another locale to the provider to change every formatter and component under it. Signed figures go through Delta, which adds the arrow; the formatters print only a minus sign.",
      body: <Code>{LOCALE}</Code>,
    },
    {
      id: "lint",
      title: "Lint",
      lead: "@siyahi/tools ships an oxlint plugin. Its rules run only in files that import @siyahi/ui, so older pages are left alone. They reject colour literals, Tailwind palette colours, arbitrary values, dark: and light: variants, numeric font sizes and per-scheme chart theme maps.",
      body: <Code>{LINT}</Code>,
    },
    {
      id: "dark-mode",
      title: "Dark mode",
      lead: "The scheme follows the device through prefers-color-scheme. There is no toggle and no class to set. The theme's dark values sit under the same dark variant as the dark: utilities, so an app that wants its own toggle swaps that one line and sets the class on html itself.",
      body: <Code>{SCHEME}</Code>,
    },
    {
      id: "rules",
      title: "The ten rules",
      lead: "What every Siyahi page keeps.",
      body: (
        <ol className="flex max-w-prose list-decimal flex-col gap-2 pl-5">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      ),
    },
  ],
};
