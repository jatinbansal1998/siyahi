import { describe, expect, it } from "vite-plus/test";
import * as ui from "../src/index";

// Pages draw charts with the chart cards; the raw Recharts parts left the package once dash and The Book moved.
const RAW_RECHARTS = [
  "Area",
  "AreaChart",
  "Bar",
  "BarChart",
  "CartesianGrid",
  "Line",
  "LineChart",
  "ReferenceLine",
  "XAxis",
  "YAxis",
];

describe("@siyahi/ui exports", () => {
  it("leaves out the raw Recharts parts", () => {
    expect(RAW_RECHARTS.filter((name) => name in ui)).toEqual([]);
  });

  it("keeps the chart cards and the chart container", () => {
    for (const name of ["BarChartCard", "AreaChartCard", "LineChartCard", "DistributionBar", "ChartContainer"]) {
      expect(name in ui, name).toBe(true);
    }
  });
});
