import { ChartAreaIcon } from "lucide-react";
import type { Page, PropRow } from "../page";

// The props every chart card shares; each family adds its own after them.
const SERIES_PROPS: PropRow[] = [
  { name: "data", type: "T[]", purpose: "One row per point on the axis, in axis order." },
  {
    name: "xKey",
    type: "keyof T",
    purpose: "The field the x axis reads: a month, an hour, a size bucket. A repeated value hides behind the first.",
  },
  {
    name: "series",
    type: "ChartSeries<T>",
    purpose: "{ key, label, color, negativeColor? } per series; color is a --chart-N slot or a meaning colour.",
  },
  { name: "title", type: "ReactNode", purpose: "The card's title." },
  { name: "description", type: "ReactNode", default: "—", purpose: "A muted line under the title." },
  { name: "action", type: "ReactNode", default: "—", purpose: "A range or mode toggle, top right of the card." },
  { name: "height", type: "number", purpose: "Fixed height of the plot and legend, in pixels." },
  {
    name: "valueFormatter",
    type: "(value: number) => string",
    default: "locale numbers",
    purpose: "A series' figure in the tooltip, and the y ticks unless yTickFormatter is set.",
  },
  {
    name: "yTickFormatter",
    type: "(value: number) => string",
    default: "valueFormatter",
    purpose: "Shorter y ticks than the tooltip's figures: moneyCompact against money.",
  },
  {
    name: "xFormatter",
    type: "(value: T[K]) => string",
    default: "the value as text",
    purpose: "Writes the x ticks, and the tooltip's heading unless xTooltipFormatter is set.",
  },
  {
    name: "xTooltipFormatter",
    type: "(value: T[K]) => string",
    default: "xFormatter",
    purpose: "A tooltip heading that says more than the tick, such as the full month.",
  },
  {
    name: "xTicks",
    type: "T[K][]",
    default: "every row",
    purpose: "The categories to label, or tick positions with xDomain. Every named tick is drawn.",
  },
  { name: "xLabel", type: "string", default: "—", purpose: "A title under the x axis. Not drawn on sideways bars." },
  {
    name: "yLabel",
    type: "string",
    default: "—",
    purpose: "A title beside the value axis, read bottom to top. Not drawn on sideways bars.",
  },
  {
    name: "yDomain",
    type: "[number, number]",
    default: "fits the data",
    purpose: "A fixed value axis, such as [0, 100].",
  },
  { name: "yTicks", type: "number[]", default: "—", purpose: "Where the value axis puts its ticks." },
  {
    name: "xTickDetail",
    type: "(row: T) => string",
    default: "—",
    purpose: "A second line under each x tick from its row, so a figure reads without a hover.",
  },
  {
    name: "referenceLines",
    type: "ChartReferenceLine[]",
    default: "—",
    purpose: "Limits ({ y }, dashed) and events ({ x }, solid), each with label?, emphasis? and labelPosition?.",
  },
  {
    name: "placeholder",
    type: "ReactNode",
    default: "—",
    purpose: "Stands in for the plot, at its height, while data loads or after it failed.",
  },
  { name: "footer", type: "ReactNode", default: "—", purpose: "A caption or takeaway under the chart." },
];

const X_DOMAIN: PropRow = {
  name: "xDomain",
  type: "[number, number]",
  default: "one slot per row",
  purpose: "Makes the x axis numeric over this range, so a tick or event can sit between samples.",
};
const CURVE: PropRow = {
  name: "curve",
  type: '"monotone" | "linear"',
  default: '"monotone"',
  purpose: "linear joins measured samples with straight segments; monotone smooths them.",
};

export const data: Page = {
  id: "data",
  title: "Data",
  icon: <ChartAreaIcon />,
  lead: "Charts, tables and figures. Each data block sits in a card, with a fixed height for charts.",
  layout: "index",
  families: [
    {
      id: "area-chart",
      title: "Area chart",
      lead: "AreaChartCard draws values over an ordered axis (months, days, hours) as filled areas.",
      imports: ["AreaChartCard", "type ChartSeries"],
      props: [
        ...SERIES_PROPS,
        X_DOMAIN,
        {
          name: "stacked",
          type: "boolean",
          default: "false",
          purpose: "Adds the series into a total; by default areas overlap.",
        },
        CURVE,
      ],
      rules: [
        "The card draws the axes, the dashed grid, Geist Mono ticks, a tooltip with each series' formatted value at the hovered point, and the legend below.",
        "A range toggle goes in action, top right.",
        "Ranked counts by category, with no order between the rows, are a BarList (Ranked list), not an area chart.",
      ],
      examples: [
        {
          name: "chart-area",
          caption: "Monthly revenue filled, its target drawn as a line over it, with a range toggle.",
        },
      ],
    },
    {
      id: "bar-chart",
      title: "Bar chart",
      lead: "BarChartCard draws values over an ordered axis as bars: one series, or several grouped or stacked.",
      imports: ["BarChartCard", "type ChartSeries"],
      props: [
        ...SERIES_PROPS,
        {
          name: "stacked",
          type: "boolean",
          default: "false",
          purpose: "One bar per point; negative values run down from zero, positive ones up.",
        },
        {
          name: "horizontal",
          type: "boolean",
          default: "false",
          purpose: "Bars run sideways with categories down the left, for long names; give a height that fits the rows.",
        },
        {
          name: "selected",
          type: "T[K] | null",
          default: "null",
          purpose: "The picked category: its bars stay solid and the rest fade.",
        },
        {
          name: "onSelect",
          type: "(value: T[K] | null) => void",
          default: "—",
          purpose: "Gets a clicked category, or null when the picked one is clicked again.",
        },
      ],
      rules: [
        "Use it when the axis has an order of its own: quarters, hours of day, size buckets. A ranked list (name, bar, figure, largest first) is a BarList.",
        'Series take --chart-1 to --chart-5 in order and never skip a slot: each reaches 3:1 against the card and its neighbours, and slots two apart share a lightness and differ by hue. Past five, fold the rest into "Other" in --muted-foreground.',
        "A gain and a loss take var(--positive) and var(--negative): give the series color and negativeColor, and each bar takes the one its sign calls for.",
        "The value axis always includes zero, so a series of losses runs down from it.",
        "The page owns the pick: hold selected in its state and set it from onSelect.",
      ],
      examples: [
        { name: "chart-bar", caption: "Three series grouped by quarter, with a toggle that stacks them." },
        {
          name: "chart-bar-hourly",
          caption: "One series by hour, with xFormatter writing 09:00 and xLabel and yLabel titling the axes.",
        },
        {
          name: "chart-bar-years",
          caption: "Profit and loss by year in the meaning colours, xTickDetail under each tick, click to pick a year.",
        },
        {
          name: "chart-bar-losses",
          caption: "A loss every year, running down from zero, with the negative colour in the legend.",
        },
        { name: "chart-bar-teams", caption: "Horizontal bars for long team names, against the plan or last year." },
        { name: "chart-bar-flows", caption: "Stacked money in and out: out runs down from zero, in runs up." },
      ],
    },
    {
      id: "line-chart",
      title: "Line chart",
      lead: "LineChartCard draws values over an ordered axis as lines, for comparing series such as a store against its category.",
      imports: ["LineChartCard", "type ChartSeries"],
      props: [...SERIES_PROPS, X_DOMAIN, CURVE],
      rules: [
        "A zero line draws by itself whenever a value goes below zero.",
        "A mode toggle sits top right; on a card narrower than about 430px it drops under the title and description, left-aligned, so a long label is never cut off.",
        "Ranked categories are a BarList, not a line chart.",
      ],
      examples: [
        {
          name: "chart-line",
          caption:
            "Sales growth against the category, with valueFormatter for the tooltip and yTickFormatter for the axis.",
        },
      ],
    },
    {
      id: "limits-and-events",
      title: "Limits and events",
      lead: "A LineChartCard over samples in time, with limits and events marked on the plot.",
      imports: ["LineChartCard", "type ChartReferenceLine"],
      props: [
        X_DOMAIN,
        {
          name: "xTicks",
          type: "number[]",
          default: "every row",
          purpose:
            "Tick positions on the numeric axis, such as whole minutes; the ones at both ends of xDomain draw too.",
        },
        {
          name: "referenceLines",
          type: "ChartReferenceLine[]",
          default: "—",
          purpose: "A limit is { y } and dashed, an event { x } and solid; label names it.",
        },
        {
          name: "referenceLines[].emphasis",
          type: '"muted" | "strong"',
          default: '"muted"',
          purpose: "strong draws the line that matters in the text colour.",
        },
        {
          name: "xTooltipFormatter",
          type: "(value: number) => string",
          default: "xFormatter",
          purpose: "A fuller tooltip heading than the tick: 19:34:13 IST against 19:34.",
        },
        {
          name: "yDomain, yTicks",
          type: "[number, number], number[]",
          default: "fits the data",
          purpose: "Fix the value axis, here 0 to 100%.",
        },
        CURVE,
      ],
      examples: [
        {
          name: "chart-line-events",
          caption: "Memory pressure every 15 s, with a dashed limit, solid events and a fixed 0–100% axis.",
        },
        {
          name: "chart-line-timeline",
          caption: "Ten-minute samples with explicit ticks, the two at the domain's ends included.",
        },
      ],
    },
    {
      id: "category-ticks",
      title: "Sparse category ticks",
      lead: "xTicks names the categories to label on BarChartCard, LineChartCard and AreaChartCard, using values from xKey.",
      imports: ["AreaChartCard", "BarChartCard", "LineChartCard"],
      props: [
        {
          name: "xTicks",
          type: "T[K][]",
          default: "every row",
          purpose:
            "The categories that get a label; the others keep their marks and tooltips without one. No xDomain needed.",
        },
        {
          name: "xTooltipFormatter",
          type: "(value: T[K]) => string",
          default: "xFormatter",
          purpose: "Keeps the full month in the tooltip when xFormatter shortens the tick.",
        },
      ],
      rules: [
        "Every named tick draws at its normal text size; when the labels need more room the plot scrolls inside its card.",
      ],
      examples: [
        {
          name: "chart-category-ticks",
          caption: "Seven years of demo monthly orders with only April labelled, as bars, sideways bars and a line.",
        },
      ],
    },
    {
      id: "waterfall-chart",
      title: "Waterfall",
      lead: "WaterfallChartCard bridges a running total step by step: where it starts, each change that moved it, and where it ends.",
      imports: ["WaterfallChartCard", "type WaterfallStep"],
      props: [
        {
          name: "steps",
          type: "WaterfallStep[]",
          purpose:
            '{ kind: "change", label, value } moves the running total; { kind: "total", label, value? } draws it from zero. Labels may repeat.',
        },
        {
          name: "steps[].value (total)",
          type: "number",
          default: "the running total",
          purpose: "Sets the total instead of reading it, as an opening balance does.",
        },
        {
          name: "horizontal",
          type: "boolean",
          default: "false",
          purpose: "Bars run sideways with the labels down the left, for long names; give a height that fits the rows.",
        },
        {
          name: "labels",
          type: "{ rise, fall, total }",
          default: '"Increase", "Decrease", "Total"',
          purpose: "What the legend and the tooltip call each kind of bar.",
        },
        {
          name: "valueFormatter",
          type: "(value: number) => string",
          default: "locale numbers",
          purpose: "Writes the tooltip's figures; a change gets its + or − in front.",
        },
        {
          name: "yTickFormatter",
          type: "(value: number, scale: number) => string",
          default: "valueFormatter",
          purpose: "Shorter value ticks than the tooltip's figures: moneyCompact against money.",
        },
        { name: "title, height", type: "ReactNode, number", purpose: "As on BarChartCard." },
        {
          name: "description, action, yLabel, referenceLines, placeholder, footer",
          type: "as BarChartCard",
          default: "—",
          purpose: "As on BarChartCard.",
        },
      ],
      rules: [
        "A rise is green and a fall red, each a tint inside a full-colour edge; a total is solid --chart-1. Use it where up is good, such as profit or revenue; for costs, show the saving as the change.",
        "A dashed line carries each level across the gap to the next bar, so the eye follows the running total.",
        "A total with a value that differs from the running total starts a new level, and no line joins it to the bar before.",
        "A step whose value is not a number (NaN) leaves every later balance unknown, so the card names that step instead of drawing.",
        "Changes that share no running total, such as each team's growth, are a BarChartCard with negativeColor.",
      ],
      examples: [
        {
          name: "waterfall-chart",
          caption: "A year's profit month by month, ending on a total read from the running sum.",
        },
        {
          name: "waterfall-chart-stores",
          caption: "Sideways bars from last year's revenue to this year's, store by store, with long names.",
        },
      ],
    },
    {
      id: "data-table",
      title: "Data table",
      lead: "niko-table on TanStack Table: faceted filters, sorting and a pinned first column, inside a card.",
      imports: [
        "DataTableRoot",
        "DataTable",
        "DataTableHeader",
        "DataTableBody",
        "DataTableToolbarSection",
        "DataTableSearchFilter",
        "DataTableFacetedFilter",
        "DataTableSortHeader",
        "DataTableRowCount",
        "DataTableCompactColumnsToggle",
        "useDataTable",
        "type DataTableColumnDef",
      ],
      props: [
        {
          name: "DataTableSortHeader title",
          type: "string",
          default: "meta.label",
          purpose: "As a column's header it sorts on one click, largest (or Z) first.",
        },
        {
          name: "DataTableSearchFilter label",
          type: "string",
          purpose: "Names the search across columns for screen readers.",
        },
        {
          name: "DataTableRowCount unit",
          type: "string",
          purpose: 'What a row is, plural: "3 of 6" while filtered, "6 products" when nothing is.',
        },
        {
          name: "DataTableRowCount total",
          type: "number",
          default: "the table's data",
          purpose: "Rows before any filter; pass it when the page narrowed the data before the table.",
        },
        {
          name: "meta.compact",
          type: "boolean",
          default: "false",
          purpose:
            "Marks a column that answers the table's question; the others hide, rightmost first, when columns do not fit.",
        },
        {
          name: "useDataTable().compactColumns.hidden",
          type: "ReadonlySet<string>",
          purpose: "The columns hidden to fit, so a cell can fold a hidden figure under a kept one.",
        },
      ],
      rules: [
        "Below 40rem of table space, horizontal freezing is suspended so every column scrolls inside the card. It follows the table's width, a narrow laptop panel included; search and sorting survive the change.",
        "DataTableColumnActions with DataTableColumnSortOptions is the menu version of the sort header.",
        "In the toolbar, DataTableSearchFilter comes first and DataTableRowCount last.",
        "Scrolling sideways hides the figure a reader came for, on a phone and a laptop alike: mark the few answering columns meta.compact, and put DataTableCompactColumnsToggle in the toolbar to show them all and back.",
      ],
      examples: [
        { name: "data-table", caption: "Search, a category filter, one-click sort headers and the row count." },
        {
          name: "data-table-filters",
          caption: "Search stays in the toolbar; the other filters move into a sheet when space is narrow.",
        },
        {
          name: "data-table-compact",
          caption:
            "meta.compact columns with the All columns toggle; the week's change folds under the revenue while hidden.",
        },
      ],
    },
    {
      id: "data-bar",
      title: "Table bars, sparklines",
      lead: "DataBar puts a short bar before a cell's figure, so a column reads as a bar chart without leaving the table.",
      imports: ["DataBar", "Sparkline"],
      props: [
        { name: "value", type: "number", purpose: "The cell's figure; the bar's length is its share of max." },
        {
          name: "max",
          type: "number",
          purpose:
            "The column's largest figure, so every row draws to one scale: Math.max(...rows.map((r) => r.value)).",
        },
        {
          name: "tone",
          type: '"chart" | "sign"',
          default: '"chart"',
          purpose: "sign draws a gain in --positive and a loss in --negative; chart draws every bar in --chart-1.",
        },
        { name: "children", type: "ReactNode", purpose: "The figure, as the page formats it." },
        {
          name: "Sparkline animate",
          type: "boolean",
          default: "true",
          purpose: "Pass false in a table, so a sort does not redraw every row's line.",
        },
      ],
      rules: [
        "The bar sits on the figure's line, so the row keeps its height.",
        "A Sparkline in a cell gives each row its recent run.",
      ],
      examples: [
        {
          name: "data-bar",
          caption:
            "Sales as bars to one scale, change in the sign tone, and a sparkline of each store's last ten days.",
        },
      ],
    },
    {
      id: "change-bar",
      title: "Change bars",
      lead: "ChangeBar sets a cell's Delta over a thin bar of its size, so a column of changes ranks by eye; DataTableFootnote says how to read it.",
      imports: ["ChangeBar", "DataTableFootnote"],
      props: [
        { name: "value", type: "number", purpose: "The signed change, as Delta takes it; for pct a fraction." },
        {
          name: "max",
          type: "number",
          purpose: "The column's largest change by size: Math.max(...rows.map((r) => Math.abs(r.change))).",
        },
        {
          name: "diverging",
          type: "boolean",
          default: "false",
          purpose:
            "Bars grow from a centre line, losses left and gains right. Pass it when the column holds both signs.",
        },
        { name: "format", type: '"pct" | "money"', default: '"pct"', purpose: "How the Delta writes the change." },
        {
          name: "DataTableFootnote children",
          type: "ReactNode",
          purpose: "One sentence on the encoding, in a full-width last row after DataTableBody.",
        },
      ],
      rules: [
        "The bar is neutral because it shows size; the Delta above it carries the gain or loss colour. Do not also colour the bar.",
        "Every row draws to the column's largest change, so give each cell the same max.",
        "The footnote stays at the card's width while a wide table scrolls under it.",
      ],
      examples: [
        {
          name: "change-bar",
          caption:
            "A month's change per region, diverging around a centre line, January's values muted, with a footnote.",
        },
      ],
    },
    {
      id: "price-chart",
      title: "PriceChart",
      lead: "TradingView Lightweight Charts in theme colours, for a long daily series such as a price or an order value.",
      imports: ["PriceChart"],
      props: [
        { name: "data", type: "LineData<Time>[]", purpose: "The series, as Lightweight Charts takes it." },
        { name: "height", type: "number", purpose: "Fixed height in pixels." },
        {
          name: "credit",
          type: "boolean",
          default: "true",
          purpose: "The library's own logo; pass false on every chart after the first on a page.",
        },
      ],
      rules: ["Keep the logo on one chart per page and put a credit link under that chart, as the example does."],
      examples: [
        { name: "price-chart", caption: "A year of made-up daily order values, with the credit link under it." },
      ],
    },
    {
      id: "treemap",
      title: "Treemap",
      lead: "Treemap tiles items by weight and colours each by its signed change, with TreemapLegend for the scale.",
      imports: ["Treemap", "TreemapLegend", "type TreemapItem"],
      props: [
        {
          name: "items",
          type: "TreemapItem[]",
          purpose: "{ name, weight, change, key?, group? } per tile; change is a fraction, or null when unknown.",
        },
        { name: "height", type: "number", purpose: "Fixed height in pixels." },
        {
          name: "range",
          type: "number",
          default: "0.05",
          purpose: "±range takes the deepest heat step, ±5% by default. Give TreemapLegend the same range.",
        },
        {
          name: "onHover",
          type: "(item: T | null) => void",
          default: "—",
          purpose:
            "Gets the item under the pointer, null on a group's name or off the map: drive a tooltip or a highlight.",
        },
        {
          name: "selected",
          type: "T | null",
          default: "—",
          purpose: "The tile that carries a ring, matched by key; pass back what onSelect gave.",
        },
        {
          name: "onSelect",
          type: "(item: T | null) => void",
          default: "—",
          purpose: "Gets a tapped tile, and null on a second tap or a tap anywhere else.",
        },
      ],
      rules: [
        "Heat is five steps of --positive and --negative mixed toward the card colour, the deepest at ±range.",
        'A change of null is a muted tile marked "—".',
        "Items with a group sit together under its name, which draws even for a group of one.",
        "Give items a key when names repeat, such as one city selling through two channels.",
        "A phone has no hover, so a tap selects a tile. The selection is the page's state, so a filter that drops the item drops its ring too.",
        "TreemapLegend draws five steps of loss, no change and five of gain, each swatch naming its span on hover.",
      ],
      examples: [
        {
          name: "treemap",
          caption:
            "Cities grouped by region, with a hover tooltip, tap to select and the selection printed under the map.",
        },
      ],
    },
    {
      id: "scatter-chart",
      title: "Scatter chart",
      lead: "ScatterChartCard plots each item as a dot by two measures, such as size against growth, with the leading names beside their dots.",
      imports: ["ScatterChartCard", "type ScatterPoint", "type ScatterDetail"],
      props: [
        {
          name: "points",
          type: "ScatterPoint[]",
          purpose:
            "{ name, x, y, key? } per dot, most important first; y is null when unknown and the dot is not drawn.",
        },
        { name: "height", type: "number", purpose: "Fixed height of the plot in pixels." },
        { name: "xLabel, yLabel", type: "string", purpose: "What each axis measures, written along it." },
        {
          name: "xScale",
          type: '"linear" | "log"',
          default: '"linear"',
          purpose: "log spreads sizes that run from tiny to large across powers of ten, ticked at 1, 2 and 5.",
        },
        {
          name: "xFormatter, yFormatter",
          type: "(value: number) => string",
          default: "locale numbers",
          purpose: "The ticks and the tooltip's figures.",
        },
        {
          name: "labels",
          type: "number",
          default: "12",
          purpose: "How many points get their name beside the dot, at most.",
        },
        {
          name: "details",
          type: "(point: T) => ScatterDetail[]",
          default: "the two figures",
          purpose:
            'The tooltip\'s rows under the name, each [label, figure], such as ["Sales", "₹9.8L"]; a screen reader hears them too.',
        },
        {
          name: "selected, onSelect",
          type: "T | null, (point: T | null) => void",
          default: "—",
          purpose:
            "The ringed point, matched by key. A tap, Enter or Space selects; a second one, Escape or a tap on the plot clears.",
        },
        {
          name: "title, description, action, footer",
          type: "ReactNode",
          default: "—",
          purpose: "As on the other chart cards.",
        },
      ],
      rules: [
        "Use it when the question is how two measures relate across many items, such as 80 stores' size and growth; a few items read better as a bar list.",
        "Give points most important first: labels go to the earliest points that have room.",
        "Every dot takes one colour: a category such as a region stays neutral (DESIGN.md). Put it in details, and let a filter on the page pick one.",
        "A name goes beside its dot only where it covers no other name and no other dot; the rest are in the tooltip, so names never pile up.",
        "A point with a null y, or at or under zero on a log axis, is not drawn: say on the page how many are left out.",
        "A phone has no hover, so a tap selects a dot. With onSelect, Tab reaches the dots and the arrow keys walk them left to right. The selection is the page's state, so a filter that drops the point drops its ring too.",
      ],
      examples: [
        {
          name: "scatter-chart",
          caption: "Stores by share of sales and growth, with a tap to select and one store left out.",
        },
      ],
    },
    {
      id: "heatmaps",
      title: "Heatmaps",
      lead: "Calendar, weekday by hour and status timeline heatmaps from the @heatmap registry.",
      imports: ["CalendarHeatmap", "WeekdayHeatmap", "StatusHeatmap"],
      rules: ["Counts fade in --chart-1."],
      examples: [
        { name: "heatmap-calendar", caption: "A year of working days, each coloured by its count of deploys." },
        { name: "heatmap-weekday", caption: "Support tickets by weekday and office hour." },
        {
          name: "heatmap-status",
          caption:
            "Sixty days of an API's status: healthy in quiet grey, degraded in --warning, critical in --destructive.",
        },
      ],
    },
    {
      id: "ranked-list",
      title: "Ranked list",
      lead: "dashboardcn's BarList: ranked counts or amounts by category, each row a name, a bar and a figure, for top-N and needs-attention lists.",
      imports: ["BarList", "type BarListItem"],
      props: [
        {
          name: "data",
          type: "BarListItem[]",
          purpose:
            "{ name, value, href?, icon?, detail?, key? } per row; detail, such as a Delta, sits after the label.",
        },
        {
          name: "valueFormatter",
          type: "(value: number) => string",
          default: "—",
          purpose: "Writes each row's figure.",
        },
        {
          name: "max",
          type: "number",
          default: "the largest value",
          purpose: "The value a full bar stands for; give two lists the same max to draw them on one scale.",
        },
        {
          name: "sortOrder",
          type: '"descending" | "ascending" | "none"',
          default: '"descending"',
          purpose: "Row order.",
        },
        { name: "color", type: "string", default: "var(--chart-1)", purpose: "The bars' colour." },
        {
          name: "showPercentage",
          type: "boolean",
          default: "false",
          purpose: "Each row's share of the total beside its value.",
        },
        { name: "onItemClick", type: "(item: BarListItem) => void", default: "—", purpose: "Makes each row a button." },
      ],
      rules: [
        "Values over an ordered axis, such as time, go in BarChartCard.",
        "A row's detail keeps its own colour; a long label truncates before the detail does.",
      ],
      examples: [
        { name: "bar-list", caption: "Customers that need attention, each drop as a Delta after its name." },
        { name: "bar-list-sides", caption: "The biggest rises and falls as two lists sharing one max." },
        {
          name: "bar-list-labels",
          caption: "Long category names that stay readable beside their counts in a narrow panel.",
        },
      ],
    },
    {
      id: "stacked-bar",
      title: "Stacked bar",
      lead: "dashboardcn's DistributionBar: one bar split into segments, with a legend of each one's share or value.",
      imports: ["DistributionBar", "type DistributionSegment"],
      props: [
        {
          name: "segments",
          type: "DistributionSegment[]",
          purpose: "{ name, value, color?, key? }; colours default to --chart-1 onward, var(--muted) for free space.",
        },
        {
          name: "max",
          type: "number",
          default: "the positive total",
          purpose: "Fixes the scale, for a budget or capacity the segments do not fill; the legend then gives values.",
        },
        {
          name: "min",
          type: "number",
          default: "the negative total, or 0",
          purpose:
            "Below zero, a negative segment stacks leftward from zero, so losses and gains pull against each other.",
        },
        {
          name: "markers",
          type: "{ at: number; label?: string }[]",
          default: "—",
          purpose: "A labelled line at a limit.",
        },
        {
          name: "highlighted",
          type: "string | null",
          default: "null",
          purpose: "The segment, by key or name, to keep solid; the rest fade.",
        },
        {
          name: "onHover",
          type: "(segment: DistributionSegment | null) => void",
          default: "—",
          purpose: "Gets the segment under the pointer, to drive a readout.",
        },
        {
          name: "valueFormatter",
          type: "(value: number) => string",
          default: "—",
          purpose: "Writes values in the legend.",
        },
        { name: "showLegend", type: "boolean", default: "true", purpose: "The legend under the bar." },
        { name: "showValues", type: "boolean", default: "false", purpose: "Values in the legend as well as shares." },
      ],
      rules: ["A ranked list of categories is a BarList, not a stacked bar."],
      examples: [
        { name: "distribution-bar-budget", caption: "A memory budget on a fixed 0–12 GiB scale with a limit marker." },
        {
          name: "distribution-bar-tug",
          caption: "Finished campaigns' losses left of zero and gains right, with a readout of the hovered one.",
        },
      ],
    },
    {
      id: "target-rows",
      title: "Target rows",
      lead: "TargetRows sets each figure against its target as a bullet row: a solid bar for the value, a tall tick for the target, grey bands for the ranges that matter.",
      imports: ["TargetRows", "type TargetRow", "type TargetStatus"],
      props: [
        {
          name: "rows",
          type: "TargetRow[]",
          purpose: "{ label, value, target, detail?, bands?, status?, key? } per row.",
        },
        {
          name: "rows[].bands",
          type: "[number, number][]",
          default: "—",
          purpose: "Ranges behind the bar; each later band is a grey step darker, so list the widest first.",
        },
        {
          name: "rows[].status",
          type: "TargetStatus",
          default: "—",
          purpose: '{ kind: "met" | "missed" | "warning", label }: ✓, — or an amber ⚠ before the label.',
        },
        {
          name: "domain",
          type: "[number, number]",
          default: "0 to the largest figure",
          purpose: "The scale every row shares, so rows compare.",
        },
        {
          name: "valueFormatter",
          type: "(value: number) => string",
          default: "useFormat().count",
          purpose: "Writes the value and the target.",
        },
      ],
      rules: [
        "Bands are neutral greys; never shade them red, amber and green. The bar stays foreground whether it beat the target or not; the status says which.",
        "Keep warning for a real problem, such as drift far enough to act on; a plain miss is —.",
        "Say how to read the bands in a line above the rows.",
        "On a card narrower than about 32rem the label and value stack above the track.",
      ],
      examples: [
        {
          name: "target-rows",
          caption: "Team spend against the budget, with ±5 and ±2 point bands and a review warning.",
        },
      ],
    },
    {
      id: "range-position",
      title: "Range position",
      lead: "RangePosition shows how far a value sits between a low and a high, such as today's response time in its 30-day range.",
      imports: ["RangePosition"],
      props: [
        { name: "low, high, value", type: "number", purpose: "The range's ends and where the value sits in it." },
        { name: "lowLabel, highLabel", type: "string", default: '"Low", "High"', purpose: "Names the ends." },
        {
          name: "caption",
          type: "ReactNode",
          default: '"of the way up the range"',
          purpose: "Follows the percentage in the full variant.",
        },
        {
          name: "valueFormatter",
          type: "(value: number) => string",
          default: "useFormat().money",
          purpose: "Writes the ends and the value.",
        },
        {
          name: "variant",
          type: '"full" | "compact"',
          default: '"full"',
          purpose: "compact fits a table cell: the ends' figures either side of the track.",
        },
      ],
      rules: [
        "A value outside the range pins the thumb to the nearer end.",
        "In a table, sort the column by the position, (value − low) / (high − low), not by the value.",
      ],
      examples: [
        {
          name: "range-position",
          caption: "One service in its 30-day range, beside the fastest, slowest and today's figure.",
        },
        {
          name: "range-position-table",
          caption: "The compact variant in a services table, sortable by how far up its range each one sits.",
        },
      ],
    },
    {
      id: "delta",
      title: "Delta",
      lead: "A signed figure in the text colour with its + or −, and a trend icon in --positive or --negative: the sign and the icon's shape carry the direction, so colour is never the only cue.",
      imports: ["Delta"],
      props: [
        { name: "value", type: "number", purpose: "The signed change; for pct a fraction, 0.025 is 2.5%." },
        { name: "format", type: '"pct" | "money"', default: '"pct"', purpose: "How the figure is written." },
      ],
      examples: [{ name: "delta", caption: "Gains, a loss and no change, as a percentage and as money." }],
    },
    {
      id: "local-time",
      title: "LocalTime",
      lead: "A time in the configured zone with the zone written, and the viewer's own clock in a tooltip.",
      imports: ["LocalTime"],
      props: [
        { name: "value", type: "Date | number | string", purpose: "The moment to show." },
        {
          name: "withDate",
          type: "boolean",
          default: "false",
          purpose: "Puts the date, in the same zone and the provider's locale, before the time, for daily snapshots.",
        },
      ],
      examples: [{ name: "local-time", caption: "A time alone and with its date." }],
    },
    {
      id: "formatters",
      title: "Formatters",
      lead: "useFormat() returns count, money, moneyCompact, pct and time bound to the nearest SiyahiProvider.",
      imports: ["useFormat", "SiyahiProvider"],
      props: [
        {
          name: "count",
          type: "(value: number) => string",
          purpose: "A whole number in the locale's grouping: 1,53,110.",
        },
        {
          name: "money",
          type: "(value: number, fractionDigits?: number) => string",
          purpose: "An amount in the locale's currency.",
        },
        {
          name: "moneyCompact",
          type: "(value: number, scale?: number) => string",
          purpose: "A short amount, ₹2.4L; in an Indian-region locale, amounts under one lakh print in full.",
        },
        {
          name: "pct",
          type: "(value: number, fractionDigits?: number) => string",
          purpose: "A fraction as a percentage.",
        },
        {
          name: "time",
          type: "(value, { withDate? }) => string",
          purpose: "A time with its zone; withDate writes the date first: 20 Oct 2026, 14:30 IST.",
        },
      ],
      rules: [
        "A nested SiyahiProvider changes the locale for its subtree.",
        "The formatters print only a minus sign; a signed figure goes through Delta, which adds the arrow.",
      ],
      examples: [
        {
          name: "formatters",
          caption: "Every formatter in the default en-IN locale and under a nested en-US provider.",
        },
      ],
    },
  ],
};
