import { InlineCode } from "@siyahi/ui";
import { Code } from "../code";
import { Lead } from "../example";
import type { Page } from "../page";

const RULES = [
  "A card holds data, prose sits on the page. One level of card.",
  "A stat tile is SectionCards from shadcn's dashboard block: muted label, outline badge, value, bold line, muted line.",
  "Charts are AreaChartCard, BarChartCard or LineChartCard: chart tokens only; the card draws the dashed horizontal grid, the tooltip and the legend below; a range or mode toggle goes top right as its action. Fixed pixel height. Ranked categories are BarList.",
  "Tables are the registry data table, inside a Card.",
  "Views switch with Tabs; secondary actions are outline buttons with an icon.",
  "Four meaning colours: positive, negative, warning, link. Nothing else is coloured.",
  "Notices are shadcn Alert, used as shipped: default for information, destructive for errors. Warnings are the default variant with an amber icon, coloured text-warning! (the ! outranks Alert's own icon colour).",
  "Stock sizes from the base-luma style. Geist, tabular figures. Geist Mono only for identifiers and ticks.",
  "Indian grouping, compact rupees, IST with zone, arrows beside colour, scheme follows the device, reduced motion honoured.",
  "On a phone: one tile per row, cards edge to edge with a 16px gutter, tables scroll inside their card with the first column pinned, sidebar becomes a drawer.",
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

export const overview: Page = {
  id: "overview",
  title: "Siyahi",
  lead: "Siyahi (Hindi for ink) is stock shadcn/ui on Base UI and Tailwind v4, shipped as @siyahi/ui with a finance theme, a few compositions, locale-aware formatters, a lint and this catalogue.",
  sections: [
    {
      id: "install",
      title: "Install",
      body: (
        <>
          <Lead>
            Pre-1.0 releases are published under the next tag. The app needs React 19 and Tailwind v4 with the Tailwind
            Vite plugin: the stylesheet is Tailwind source, so without the plugin every component is unstyled. A Next.js
            app uses @tailwindcss/postcss instead.
          </Lead>
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
      body: (
        <>
          <Lead>
            Numbers, money and times default to en-IN, INR and Asia/Kolkata: 1,53,110, ₹2.4L, 14:30 IST. In an
            Indian-region locale moneyCompact prints amounts under one lakh in full (₹99,999), never as K. Pass another
            locale to the provider to change every formatter and component under it. Signed figures go through Delta,
            which adds the arrow; the formatters print only a minus sign.
          </Lead>
          <Code>{LOCALE}</Code>
        </>
      ),
    },
    {
      id: "lint",
      title: "Lint",
      body: (
        <>
          <Lead>
            @siyahi/tools ships an oxlint plugin. Its rules run only in files that import @siyahi/ui, so older pages are
            left alone. They reject colour literals, Tailwind palette colours, arbitrary values, dark: and light:
            variants, numeric font sizes and per-scheme chart theme maps.
          </Lead>
          <Code>{LINT}</Code>
        </>
      ),
    },
    {
      id: "dark-mode",
      title: "Dark mode",
      body: (
        <>
          <Lead>
            The scheme follows the device through prefers-color-scheme. There is no toggle and no class to set. The
            theme's dark values sit under the same dark variant as the dark: utilities, so an app that wants its own
            toggle swaps that one line and sets the class on html itself.
          </Lead>
          <Code>{SCHEME}</Code>
        </>
      ),
    },
    {
      id: "rules",
      title: "The ten rules",
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
