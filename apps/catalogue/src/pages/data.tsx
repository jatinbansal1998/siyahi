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
            AreaChartCard: values over an ordered axis (months, days, hours) as filled areas, such as a portfolio's
            value against the money put in. Pass rows, the axis field as xKey and the series; the card draws the axes,
            the dashed grid, Geist Mono ticks, a tooltip naming the hovered point with each series' formatted value, and
            the legend below. Areas overlap; stacked adds them into a total. A range toggle goes in action, top right.
            For ranked counts by category, with no order between the rows, use the BarList under Ranked list instead.
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
            BarChartCard: values over an ordered axis as bars, one series or several, grouped side by side or stacked.
            Use it when the axis has an order of its own, such as quarters, hours of day or price buckets; for a ranked
            list (a name, a bar and a figure per row, largest first) use BarList. Series take the slots --chart-1 to
            --chart-5 in order: each reaches 3:1 against the card and the slots next to it, and slots two apart share a
            lightness and differ by hue, so do not skip slots. Past five, fold the rest into "Other" in
            --muted-foreground. xFormatter writes the axis and the tooltip's heading, here an hour as 09:00; xLabel and
            yLabel title the axes. xTickDetail adds a second line under each tick from its row, so a year's net reads
            without a hover. A gain and a loss take var(--positive) and var(--negative): give the series color and
            negativeColor, and each bar takes the one its sign calls for. selected and onSelect let a click on a bar
            pick its category; the other bars fade, and a second click clears it. The page owns the pick. horizontal
            lays the bars sideways with the categories down the left, for long names such as sectors; give it a height
            that fits the rows. footer puts a caption under the chart, and placeholder stands in for the plot while its
            data loads or after it failed.
          </Lead>
          <Example name="chart-bar" />
          <Example name="chart-bar-hourly" />
          <Example name="chart-bar-years" />
          <Example name="chart-bar-sectors" />
        </>
      ),
    },
    {
      id: "line-chart",
      title: "Line chart",
      body: (
        <>
          <Lead>
            LineChartCard: values over an ordered axis as lines, for comparing series such as a portfolio against its
            index. A level of zero gets a reference line whenever a value goes below it. valueFormatter writes the
            tooltip's figures and yTickFormatter the shorter axis ticks. A mode toggle sits top right; on a card
            narrower than about 430px it drops under the title and description, left-aligned, so a toggle with longer
            labels is never cut off at the card's edge. Not for ranked categories: that is BarList.
          </Lead>
          <Example name="chart-line" />
        </>
      ),
    },
    {
      id: "limits-and-events",
      title: "Limits and events",
      body: (
        <>
          <Lead>
            A line chart over samples in time. xDomain makes the x axis numeric, so a tick or an event can sit between
            two samples; xTicks puts the ticks where the page wants them, here on whole minutes. referenceLines mark
            limits (a y value, dashed) and events (an x value, solid), each with an optional label; emphasis: "strong"
            draws the one that matters in the text colour. xTooltipFormatter gives the tooltip a fuller heading than the
            tick. yDomain and yTicks fix the value axis, here 0 to 100%. curve="linear" joins measured samples with
            straight lines; the default smooths them.
          </Lead>
          <Example name="chart-line-events" />
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
            its card. DataTableSortHeader as a column's header sorts on one click, largest (or Z) first, taking its
            title from meta.label; DataTableColumnActions with DataTableColumnSortOptions is the menu version. In the
            toolbar, DataTableSearchFilter is the search across columns (label names it for screen readers) and
            DataTableRowCount, last, says how many rows the filters leave: "3 of 6", or "6 holdings" when they leave
            all. Pass total when the page narrowed the data before the table.
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
          <Lead>
            Signed heat: five steps of --positive and --negative mixed toward the card colour, the deepest at ±range
            (default 0.05, ±5%). A change of null is a muted tile marked "—". Items with a group sit together under its
            name, which draws even for a group of one. Give items a key when names repeat, such as one symbol at two
            brokers. onHover gets the item under the pointer, and null on a group's name or off the map: drive a tooltip
            with it, or highlight the same item elsewhere on the page. A phone has no hover, so a tap selects a tile:
            onSelect gets the item, and the tile passed back as selected gets a ring; a second tap or a tap anywhere
            else gives null. The selection is the page's state, so a filter that drops the item drops its ring too. The
            example prints the selection under the map. TreemapLegend, given the same range, draws the scale: five steps
            of loss, no change, five of gain, each swatch naming its span on hover.
          </Lead>
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
          <Lead>
            dashboardcn's bar list, for "needs attention" and top-N lists: ranked counts or amounts by category, where
            each row is a name, a bar and a figure. Values over an ordered axis such as time go in BarChartCard. An
            item's detail, such as a Delta, sits after its label in its own colour; a long label truncates before the
            detail does. max sets the value a full bar stands for: give two lists the same max, as the gains and losses
            here, and they share one scale.
          </Lead>
          <Example name="bar-list" />
          <Example name="bar-list-sides" />
        </>
      ),
    },
    {
      id: "stacked-bar",
      title: "Stacked bar",
      body: (
        <>
          <Lead>
            dashboardcn's distribution bar: one bar split into segments, with a legend that gives each one's share, or
            its value when the bar has a fixed scale. max fixes that scale, for a budget or a capacity the segments do
            not fill, and markers draw a labelled line at a limit. With a min below zero, a negative segment stacks
            leftward from zero, so losses and gains pull against each other; highlighted and onHover drive a readout
            from the segment under the pointer. For a ranked list of categories, use BarList.
          </Lead>
          <Example name="distribution-bar-budget" />
          <Example name="distribution-bar-tug" />
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
          <Lead>
            A time in the configured zone with the zone written, and the viewer's own clock in a tooltip. withDate puts
            the date, in the same zone and the provider's locale, before the time, for daily snapshots.
          </Lead>
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
            useFormat() returns count, money, moneyCompact, pct and time bound to the nearest SiyahiProvider. A nested
            provider changes the locale for its subtree. useFormat().time(value, {"{ withDate: true }"}) writes the date
            first: 20 Oct 2026, 14:30 IST. In an Indian-region locale moneyCompact prints amounts under one lakh in
            full. The formatters print only a minus sign; a signed figure goes through Delta, which adds the arrow.
          </Lead>
          <Example name="formatters" />
        </>
      ),
    },
  ],
};
