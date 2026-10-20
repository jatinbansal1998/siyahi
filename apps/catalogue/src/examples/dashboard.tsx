import ChartAreaExample from "./chart-area";
import DataTableExample from "./data-table";
import SectionCardsExample from "./section-cards";

// dashboard-01's page: stat tiles, then a chart, then a table, each data block in a card of its own.
export default function DashboardExample() {
  return (
    <div className="flex flex-col gap-4">
      <SectionCardsExample />
      <ChartAreaExample />
      <DataTableExample />
    </div>
  );
}
