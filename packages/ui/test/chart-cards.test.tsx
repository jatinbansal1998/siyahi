import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { AreaChartCard } from "../src/components/registry/charts/area-chart-card";
import { LineChartCard } from "../src/components/registry/charts/line-chart-card";
import { ScatterChartCard } from "../src/components/siyahi/scatter-chart";

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

  it("shows the placeholder in the plot's place, at the plot's height", () => {
    const html = renderToStaticMarkup(<LineChartCard {...base} placeholder={<p>Loading the index…</p>} />);
    expect(html).toMatch(/data-slot="chart-placeholder"[^>]*style="height:200px"><p>Loading the index…<\/p>/);
    expect(html).not.toContain('data-slot="chart"');
  });
});

describe("value axis scale", () => {
  it("disables Log and draws linear when a value is below zero, saying why", () => {
    const html = renderToStaticMarkup(
      <LineChartCard {...base} data={[...data, { minute: 20, used: -5 }]} yScale="log" yScaleToggle />,
    );
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Linear<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Log<\/button>/);
    expect(html).toContain("Log needs every value above zero");
  });

  it("disables Log on stacked areas, which add up from zero", () => {
    const html = renderToStaticMarkup(<AreaChartCard {...base} stacked yScaleToggle />);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Log<\/button>/);
    expect(html).toContain("Log cannot show stacked areas");
  });

  it("disables a scatter axis' Log only where a value is at or below zero", () => {
    const html = renderToStaticMarkup(
      <ScatterChartCard
        title="Holdings"
        points={[
          { name: "A", x: 0.004, y: -0.1 },
          { name: "B", x: 0.147, y: 0.2 },
        ]}
        height={300}
        xLabel="Share"
        yLabel="Return"
        xScaleToggle
        yScaleToggle
      />,
    );
    const group = (label: string) => html.slice(html.indexOf(`aria-label="${label}"`)).split("</div>")[0];
    expect(group("Share scale")).not.toContain('disabled=""');
    expect(group("Return scale")).toMatch(/<button[^>]*disabled=""[^>]*>Log<\/button>/);
  });
});
