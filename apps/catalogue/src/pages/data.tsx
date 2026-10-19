import { Example, Lead } from "../example";
import type { Page } from "../page";

export const data: Page = {
  id: "data",
  title: "Data",
  lead: "Charts, tables and figures. Each data block sits in a card, with a fixed height for charts.",
  sections: [
    {
      id: "area-chart",
      title: "Area chart",
      body: (
        <>
          <Lead>
            shadcn's chart over Recharts. Chart tokens only, a dashed horizontal grid, the legend below, a range toggle
            top right. Give each series a colour with color: "var(--chart-n)", never a theme map: shadcn's chart applies
            a map's dark half under a .dark class Siyahi never sets, while the variable already follows the scheme. The
            lint rule siyahi/no-chart-theme-map catches it.
          </Lead>
          <Example name="chart-area" />
        </>
      ),
    },
    {
      id: "bar-chart",
      title: "Bar chart",
      body: (
        <>
          <Lead>
            Categorical series take the slots --chart-1 to --chart-5 in order. Each slot reaches 3:1 against the card
            and the slots next to it; slots two apart share a lightness and are told apart by hue, so do not skip slots.
            Past five, fold the rest into "Other" in --muted-foreground.
          </Lead>
          <Example name="chart-bar" />
        </>
      ),
    },
    {
      id: "line-chart",
      title: "Line chart",
      body: (
        <>
          <Lead>Reference lines mark a level such as zero or a target.</Lead>
          <Example name="chart-line" />
        </>
      ),
    },
    {
      id: "data-table",
      title: "Data table",
      body: (
        <>
          <Lead>
            niko-table on TanStack Table: faceted filters, sorting, a pinned first column. On a phone it scrolls inside
            its card.
          </Lead>
          <Example name="data-table" />
        </>
      ),
    },
    {
      id: "price-chart",
      title: "PriceChart",
      body: (
        <>
          <Lead>
            TradingView Lightweight Charts in theme colours. The library paints its own logo; keep it on one chart per
            page (pass credit={"{false}"} to the rest) and put a credit link under that chart, as the example does.
          </Lead>
          <Example name="price-chart" />
        </>
      ),
    },
    {
      id: "treemap",
      title: "Treemap",
      body: (
        <>
          <Lead>Signed heat: steps of --positive and --negative mixed toward the card colour.</Lead>
          <Example name="treemap" />
        </>
      ),
    },
    {
      id: "heatmaps",
      title: "Heatmaps",
      body: (
        <>
          <Lead>
            Calendar, weekday by hour and status timeline from the @heatmap registry. Counts fade in --chart-1.
          </Lead>
          <Example name="heatmap-calendar" />
          <Example name="heatmap-weekday" />
          <Example name="heatmap-status" />
        </>
      ),
    },
    {
      id: "ranked-list",
      title: "Ranked list",
      body: (
        <>
          <Lead>dashboardcn's bar list, for "needs attention" and top-N lists.</Lead>
          <Example name="bar-list" />
        </>
      ),
    },
    {
      id: "delta",
      title: "Delta",
      body: (
        <>
          <Lead>A signed figure: ▲ in --positive, ▼ in --negative, so colour is never the only cue.</Lead>
          <Example name="delta" />
        </>
      ),
    },
    {
      id: "local-time",
      title: "LocalTime",
      body: (
        <>
          <Lead>A time in the configured zone with the zone written, and the viewer's own clock in a tooltip.</Lead>
          <Example name="local-time" />
        </>
      ),
    },
    {
      id: "formatters",
      title: "Formatters",
      body: (
        <>
          <Lead>
            useFormat() returns money, moneyCompact, pct and time bound to the nearest SiyahiProvider. A nested provider
            changes the locale for its subtree. In an Indian-region locale moneyCompact prints amounts under one lakh in
            full. The formatters print only a minus sign; a signed figure goes through Delta, which adds the arrow.
          </Lead>
          <Example name="formatters" />
        </>
      ),
    },
  ],
};
