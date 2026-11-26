// A page compiled as The Book is, with exactOptionalPropertyTypes, against the built package's declarations: a
// prop the page sets only sometimes is written `prop: cond ? value : undefined`, which `prop?: T` alone rejects.
// `pnpm --filter @siyahi/ui typecheck` compiles it after the build; the lint rule
// siyahi/optional-accepts-undefined keeps every other optional prop in the package the same.
import type * as ui from "@siyahi/ui";

declare const loss: boolean;
declare const label: string | undefined;
declare const pick: ((label: string) => void) | undefined;

export const strip = {
  label: "Penalties",
  value: "₹1,200",
  tone: loss ? "negative" : undefined,
  change: loss ? -0.04 : undefined,
  changeFormat: loss ? "pct" : undefined,
  note: label,
  trend: loss ? [3, 2, 1] : undefined,
  stale: loss ? "3 Nov" : undefined,
  disabled: loss ? true : undefined,
} satisfies ui.MetricStripItem;

export const strips = { items: [strip], selected: label, onSelect: pick } satisfies ui.MetricStripProps;

export const body = {
  getRowTone: loss ? () => "negative" : undefined,
  getRowMemoKey: undefined,
} satisfies ui.DataTableBodyProps<{ id: string }>;

export const callout = { tone: loss ? "warning" : undefined } satisfies ui.CalloutProps;

export const chart = {
  title: "Sales",
  height: 240,
  data: [{ day: "Mon", value: 1 }],
  xKey: "day",
  series: [
    { key: "value", label: "Value", color: "var(--chart-1)", negativeColor: loss ? "var(--negative)" : undefined },
  ],
  stale: label,
  today: loss ? "Mon" : undefined,
  yScaleToggle: loss ? true : undefined,
} satisfies ui.LineChartCardProps<{ day: string; value: number }, "day">;

// Settings and options a component inherits from elsewhere take undefined too.
export const provider = {
  locale: { currency: loss ? "USD" : undefined },
  children: null,
} satisfies ui.SiyahiProviderProps;

export const sidebar = {
  navMain: [],
  collapsible: loss ? "none" : undefined,
  side: loss ? "right" : undefined,
} satisfies ui.AppSidebarProps;

declare const pinning: Parameters<typeof ui.DataTableRoot<{ id: string }>>[0]["onColumnPinningChange"];
export const root = {
  data: [{ id: "a" }],
  columns: [],
  children: null,
  onColumnPinningChange: loss ? pinning : undefined,
} satisfies Parameters<typeof ui.DataTableRoot<{ id: string }>>[0];

export const timeSeries = {
  panes: [
    {
      height: loss ? 120 : undefined,
      series: [
        { label: "Net contracts", color: "var(--chart-2)", data: [{ time: "2026-11-02", value: -1 }] },
        { type: loss ? "area" : undefined, label: "Close", color: "var(--chart-1)", data: [] },
        { type: "baseline", label: "Gain", base: loss ? 100 : undefined, data: [{ time: "2026-11-02", value: null }] },
      ],
      levels: [{ value: 0, label }],
      format: loss ? String : undefined,
    },
  ],
  events: loss ? [{ time: "2026-11-02", label: "Nov 2026", pane: loss ? 1 : undefined }] : undefined,
  range: loss ? "1M" : undefined,
  onZoom: loss ? () => {} : undefined,
  scale: loss ? "log" : undefined,
  credit: loss ? false : undefined,
  "aria-label": label,
} satisfies ui.TimeSeriesChartProps;

export const timeSeriesCard = {
  title: "Close",
  panes: timeSeries.panes,
  range: loss ? "1Y" : undefined,
  rangeToggle: loss ? true : undefined,
  yScale: loss ? "log" : undefined,
  yScaleToggle: loss ? true : undefined,
  stale: loss ? "3 Nov" : undefined,
} satisfies ui.TimeSeriesChartCardProps;
