import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { seriesFill, seriesRow } from "../src/lib/chart-frame";

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
