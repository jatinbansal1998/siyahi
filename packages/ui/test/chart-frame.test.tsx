import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { QuietLegend, axisValues, linearValueAxis, logValueAxis, seriesFill, seriesRow } from "../src/lib/chart-frame";
import { fittedChartHeight } from "../src/lib/chart-series";

const row = seriesRow<{ month: string; value: number | null }>(
  [{ key: "value", label: "Value", color: "var(--chart-1)" }],
  (value) => `₹${value}`,
);

describe("seriesRow", () => {
  it("shows a series' value through the page's formatter", () => {
    expect(renderToStaticMarkup(row(1200, "value", { dataKey: "value" }))).toContain(">₹1200</span>");
  });

  it("shows — for a row with no value, not the formatter's 0", () => {
    expect(renderToStaticMarkup(row(null, "value", { dataKey: "value" }))).toContain(">—</span>");
  });
});

describe("seriesFill", () => {
  const net = {
    key: "net" as const,
    label: "Net",
    color: "var(--positive)" as const,
    negativeColor: "var(--negative)" as const,
  };

  it("takes the negative colour when every value is below zero, so the legend chip matches the bars", () => {
    expect(seriesFill(net, [{ net: -3 }, { net: -1 }])).toBe("var(--negative)");
  });

  it("skips a row with no value, so one empty year does not turn the chip back", () => {
    expect(seriesFill(net, [{ net: -3 }, { net: null }, { net: -1 }])).toBe("var(--negative)");
    expect(seriesFill(net, [{ net: -3 }, { net: Number.NaN }])).toBe("var(--negative)");
  });

  it("keeps the series colour when any value is at or above zero", () => {
    expect(seriesFill(net, [{ net: -3 }, { net: 2 }])).toBe("var(--positive)");
    expect(seriesFill({ ...net, negativeColor: undefined }, [{ net: -3 }])).toBe("var(--positive)");
    expect(seriesFill(net, [{ net: null }])).toBe("var(--positive)");
  });
});

describe("QuietLegend", () => {
  const series = [
    { key: "debt", label: "Debt", color: "var(--muted-foreground)" },
    { key: "liquid", label: "Liquid", color: "var(--muted-foreground)" },
    { key: "gold", label: "Gold", color: "var(--chart-1)" },
  ] as const;
  const legend = (raisable: boolean) =>
    renderToStaticMarkup(<QuietLegend series={series} raisable={raisable} raised="debt" onRaise={() => {}} />);

  it("makes each grey name on lines a button that raises its line", () => {
    expect(
      [...legend(true).matchAll(/<button[^>]*aria-pressed="(\w+)"[^>]*>.*?<\/div>(\w+)<\/button>/g)].map(
        ([, pressed, name]) => [name, pressed],
      ),
    ).toEqual([
      ["Debt", "true"],
      ["Liquid", "false"],
    ]);
  });

  it("keeps a stack's grey names plain: a raised copy would trace the series, not its band's edge", () => {
    const html = legend(false);
    expect(html).not.toContain("<button");
    expect(html).toContain("Debt");
    expect(html).toContain("Liquid");
  });
});

describe("axisValues", () => {
  const rows = [
    { q: "Q1", a: 30, b: -10, c: 5 },
    { q: "Q2", a: 20, b: null, c: -15 },
  ];
  const series = (["a", "b", "c"] as const).map((key) => ({ key, label: key, color: "var(--chart-1)" as const }));

  it("reaches each value drawn when the series overlap", () => {
    expect(axisValues(rows, series)).toEqual([30, -10, 5, 20, -15]);
  });

  it("reaches a stack's running totals, from zero", () => {
    expect(axisValues(rows, series, "none")).toEqual([0, 30, 20, 25, 0, 20, 5]);
  });

  it("reaches each row's sum of losses below zero and of gains above it on a signed stack", () => {
    expect(axisValues(rows, series, "sign")).toEqual([-10, 35, -15, 20]);
  });
});

describe("linearValueAxis", () => {
  const series = [{ key: "a" as const, label: "A", color: "var(--chart-1)" as const }];

  it("reaches a level the page draws past the data, so its line stays on the plot", () => {
    const levels = linearValueAxis([{ a: 41 }, { a: 46 }], series, { referenceLines: [{ y: 10 }, { y: 60 }] });
    expect(levels?.domain).toEqual([10, 60]);
  });

  it("reaches the page's own ticks, so each one it gives is drawn", () => {
    const ticked = linearValueAxis([{ a: 41 }, { a: 46 }], series, { yTicks: [0, 25, 50, 75, 100] });
    expect(ticked?.domain).toEqual([0, 100]);
  });
});

describe("logValueAxis", () => {
  it("reaches a level past the data, and leaves out one at zero, which log cannot draw", () => {
    expect(logValueAxis([41, 46], [{ y: 10 }, { y: 60 }, { y: 0 }]).domain).toEqual([10, 100]);
  });
});

describe("fittedChartHeight", () => {
  it("is 45% of the width, from 240px on a phone to 420px on a wide screen", () => {
    expect([0, 358, 700, 1500, 3000].map(fittedChartHeight)).toEqual([240, 240, 315, 420, 420]);
  });
});
