import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { seriesRow } from "../src/lib/chart-frame";

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
