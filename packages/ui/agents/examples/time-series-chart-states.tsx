import { PanelGrid, Skeleton, TimeSeriesChartCard, type TimeSeriesChartPane } from "@siyahi/ui";

// 60 made-up daily closes to 3 November 2026.
const data = Array.from({ length: 60 }, (_, i) => ({
  time: new Date(Date.UTC(2026, 8, 5 + i)).toISOString().slice(0, 10),
  value: 480 + i * 0.9 + Math.sin(i / 5) * 14,
}));
const panes: TimeSeriesChartPane[] = [{ height: 200, series: [{ label: "Close", color: "var(--chart-1)", data }] }];

export default function TimeSeriesChartStatesExample() {
  return (
    <PanelGrid columns={2}>
      <TimeSeriesChartCard title="Close, last updated 3 November" panes={panes} stale="3 Nov" credit={false} />
      <TimeSeriesChartCard
        title="Close"
        panes={panes}
        placeholder={<Skeleton className="size-full" />}
        credit={false}
      />
    </PanelGrid>
  );
}
