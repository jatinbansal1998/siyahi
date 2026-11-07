import { describe, expect, it } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { WaterfallChartCard, waterfallBars } from "../src/components/siyahi/waterfall-chart";

describe("waterfallBars", () => {
  it("floats each change from the level the one before left", () => {
    const bars = waterfallBars([
      { kind: "total", label: "Opening", value: 100 },
      { kind: "change", label: "Sales", value: 40 },
      { kind: "change", label: "Refunds", value: -15 },
    ]);
    expect(bars.map(({ kind, span, level }) => ({ kind, span, level }))).toEqual([
      { kind: "total", span: [0, 100], level: 100 },
      { kind: "rise", span: [100, 140], level: 140 },
      { kind: "fall", span: [125, 140], level: 125 },
    ]);
  });

  it("spans a bar low to high whichever way it moved, below zero too", () => {
    const bars = waterfallBars([
      { kind: "total", label: "Opening", value: -100 },
      { kind: "change", label: "Fees", value: -50 },
      { kind: "total", label: "Closing" },
    ]);
    expect(bars.map(({ span }) => span)).toEqual([
      [-100, 0],
      [-150, -100],
      [-150, 0],
    ]);
  });

  it("places each bar by its position, so a label can repeat", () => {
    const bars = waterfallBars([
      { kind: "total", label: "Balance", value: 100 },
      { kind: "change", label: "Sales", value: 40 },
      { kind: "total", label: "Balance" },
    ]);
    expect(bars.map(({ key, label }) => [key, label])).toEqual([
      ["0", "Balance"],
      ["1", "Sales"],
      ["2", "Balance"],
    ]);
  });

  it("reads a total without a value off the running total, and joins it to the bar before", () => {
    const [, total] = waterfallBars([
      { kind: "change", label: "Apr", value: 30 },
      { kind: "total", label: "Year" },
    ]);
    expect(total).toMatchObject({ span: [0, 30], change: 0, continues: true });
  });

  it("starts a new level at a total with a value of its own, unjoined", () => {
    const [, , reset] = waterfallBars([
      { kind: "total", label: "Plan", value: 100 },
      { kind: "change", label: "Slip", value: -10 },
      { kind: "total", label: "Re-forecast", value: 120 },
    ]);
    expect(reset).toMatchObject({ span: [0, 120], level: 120, change: 30, continues: false });
  });

  it("names the step with no figure instead of drawing balances that would be wrong", () => {
    const html = renderToStaticMarkup(
      <WaterfallChartCard
        title="Cash"
        height={200}
        steps={[
          { kind: "change", label: "Apr", value: 10 },
          { kind: "change", label: "May", value: Number.NaN },
          { kind: "change", label: "Jun", value: 20 },
          { kind: "total", label: "Year" },
        ]}
      />,
    );
    expect(html).toContain("May has no figure, so the running total after it is unknown.");
    expect(html).not.toContain('data-slot="chart"');
  });
});
