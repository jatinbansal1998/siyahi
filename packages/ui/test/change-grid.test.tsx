import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { ChangeGrid, type ChangeGridRow } from "../src/components/siyahi/change-grid";
import { heatFill } from "../src/lib/heat";

/** Each cell's text and background, in reading order, from the rendered table. */
function cells(rows: ChangeGridRow[], format?: "pct" | "money"): { text: string; fill: string }[] {
  const html = renderToStaticMarkup(
    <ChangeGrid label="Growth" columns={["Apr", "May", "Jun"]} rows={rows} format={format} />,
  );
  return [...html.matchAll(/data-slot="change-grid-cell"[^>]*style="background-color:([^"]*)"[^>]*>([^<]*)</g)].map(
    ([, fill = "", text = ""]) => ({ text, fill }),
  );
}

describe("ChangeGrid", () => {
  it("tints each cell by its sign and its size against the grid's largest", () => {
    const [big, small, loss] = cells([{ label: "FY25", values: [0.05, 0.01, -0.02] }]);
    expect(big?.fill).toBe(heatFill("positive", 5));
    expect(small?.fill).toBe(heatFill("positive", 1));
    expect(loss?.fill).toBe(heatFill("negative", 2));
    expect([big?.text, small?.text, loss?.text]).toEqual(["+5.0%", "+1.0%", "−2.0%"]);
  });

  it("marks a month with no figure — and a month with no change 0, both muted", () => {
    const [, none, zero] = cells([{ label: "FY26", values: [0.03, null, 0] }]);
    expect(none).toEqual({ text: "—", fill: "var(--muted)" });
    expect(zero).toEqual({ text: "0.0%", fill: "var(--muted)" });
  });

  it("writes every amount in the grid's largest unit", () => {
    const texts = cells([{ label: "Koramangala", values: [520_000, -42_000, 0] }], "money").map(({ text }) => text);
    expect(texts).toEqual(["+₹5.2L", "−₹0.42L", "₹0"]);
  });

  it("treats NaN as no figure, so it neither shows nor spoils the grid's unit", () => {
    const texts = cells([{ label: "Koramangala", values: [Number.NaN, 520_000, -42_000] }], "money");
    expect(texts).toEqual([
      { text: "—", fill: "var(--muted)" },
      expect.objectContaining({ text: "+₹5.2L" }),
      expect.objectContaining({ text: "−₹0.42L" }),
    ]);
  });

  it("draws the total column only when a row has a total, untinted", () => {
    const without = renderToStaticMarkup(
      <ChangeGrid label="Growth" columns={["Apr"]} rows={[{ label: "FY25", values: [0.01] }]} />,
    );
    expect(without).not.toContain(">Total</th>");
    const html = renderToStaticMarkup(
      <ChangeGrid
        label="Growth"
        columns={["Apr"]}
        rows={[{ label: "FY25", values: [0.01], total: 0.124 }]}
        totalLabel="Year"
      />,
    );
    expect(html).toContain(">Year</th>");
    expect(html).toMatch(/<td[^>]*class="[^"]*font-medium[^"]*">\+12\.4%<\/td>/);
  });
});
