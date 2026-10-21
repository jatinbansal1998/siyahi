import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { LineChartCard } from "../src/components/registry/charts/line-chart-card";

const data = [
  { minute: 0, used: 10 },
  { minute: 10, used: 30 },
];
const base = {
  title: "Memory in use",
  data,
  xKey: "minute" as const,
  series: [{ key: "used" as const, label: "Used", color: "var(--chart-1)" as const }],
  height: 200,
};

describe("chart cards", () => {
  it("puts footer lines in the card's footer", () => {
    const html = renderToStaticMarkup(<LineChartCard {...base} footer={<p>Swap full, RAM 60% used.</p>} />);
    expect(html).toMatch(/data-slot="card-footer"[^>]*><p>Swap full, RAM 60% used\.<\/p>/);
  });
});
