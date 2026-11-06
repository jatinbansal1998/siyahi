import ChartArea from "./chart-area";
import DataTableExample from "./data-table";
import MetricStrip from "./metric-strip";

// What a page built with Siyahi looks like: a metric strip, a chart card and a data table, each the catalogue's own example.
export default function OverviewDashboard() {
  return (
    <div className="flex flex-col gap-4">
      <MetricStrip />
      {/* Each card keeps its own height: stretched to the taller one, the chart card ends in blank space. */}
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <ChartArea />
        <DataTableExample />
      </div>
    </div>
  );
}
