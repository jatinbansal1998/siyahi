import { BarChartCard, BlockState, Button, PanelGrid, Skeleton, type ChartSeries } from "@siyahi/ui";

interface Hour {
  hour: string;
  orders: number;
}
const series: ChartSeries<Hour> = [{ key: "orders", label: "Orders", color: "var(--chart-1)" }];
// Nothing has arrived yet, so every chart has no rows.
const none: Hour[] = [];

export default function BlockStateChartExample() {
  return (
    <PanelGrid columns={3}>
      <BarChartCard
        title="Orders by hour today"
        description="Orders placed each hour (IST)"
        data={none}
        xKey="hour"
        series={series}
        placeholder={<Skeleton className="size-full" />}
      />
      <BarChartCard
        title="Refunds by hour today"
        description="Refunds issued each hour (IST)"
        data={none}
        xKey="hour"
        series={series}
        placeholder={
          <BlockState title="No refund today" description="A refund shows here within a minute of being issued." />
        }
      />
      <BarChartCard
        title="Returns by hour today"
        description="Returns booked each hour (IST)"
        data={none}
        xKey="hour"
        series={series}
        placeholder={
          <BlockState
            tone="negative"
            title="Returns failed to load"
            description="The returns service did not answer. Retry, or check back in a few minutes."
            action={
              <Button variant="outline" size="sm">
                Retry
              </Button>
            }
          />
        }
      />
    </PanelGrid>
  );
}
