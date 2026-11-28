import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import {
  HistogramChartCard,
  edgeTicks,
  histogram,
  percentile,
  placeMarks,
} from "../src/components/siyahi/histogram-chart";

describe("histogram", () => {
  it("buckets values at one round width, counting every value once", () => {
    const bins = histogram([3, 7, 12, 18, 18, 41], 5);
    expect(bins.map(({ from, to, count }) => [from, to, count])).toEqual([
      [0, 10, 2],
      [10, 20, 3],
      [20, 30, 0],
      [30, 40, 0],
      [40, 50, 1],
    ]);
  });

  it("puts the largest value in the last bucket even when it sits on the top edge", () => {
    const bins = histogram([0, 5, 10], 2);
    expect(bins.at(-1)).toMatchObject({ to: 10, count: 2 });
    expect(bins.reduce((sum, { count }) => sum + count, 0)).toBe(3);
  });

  it("leaves out values that are not numbers", () => {
    expect(histogram([1, Number.NaN, 2]).reduce((sum, { count }) => sum + count, 0)).toBe(2);
  });
});

describe("histogram at decimal edges", () => {
  it("puts a value on a decimal edge in the bucket that starts there", () => {
    const counts = histogram([0, 0.1, 0.2, 0.3, 0.4, 0.5], 5).map(({ count }) => count);
    expect(counts).toEqual([1, 1, 1, 1, 2]);
  });

  it("counts a value just under a decimal edge without losing it", () => {
    const bins = histogram([0.3 - Number.EPSILON, 0.4], 2);
    expect(bins.reduce((sum, { count }) => sum + count, 0)).toBe(2);
  });

  it("buckets 200,000 values without overflowing the call stack", () => {
    const bins = histogram(
      Array.from({ length: 200_000 }, (_, i) => i),
      12,
    );
    expect(bins.reduce((sum, { count }) => sum + count, 0)).toBe(200_000);
  });
});

describe("percentile", () => {
  it("interpolates between the two nearest values, as a spreadsheet's PERCENTILE does", () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0.95)).toBeCloseTo(38.5);
  });
});

describe("histogram's reach", () => {
  it("reaches to cover a mark past the values without counting it", () => {
    const bins = histogram([12, 18], 5, [-3]);
    expect(bins[0]!.from).toBeLessThanOrEqual(-3);
    expect(bins.reduce((sum, { count }) => sum + count, 0)).toBe(2);
  });
});

describe("edgeTicks", () => {
  // 0 to 1,100 in 100s: twelve edges, the widest label "1,000" (35px).
  const bins = histogram([0, 1050], 12);

  it("names every edge when the chart is wide enough for all of them", () => {
    expect(edgeTicks(bins, String, 1200)).toHaveLength(12);
  });

  it("names every other edge, at round multiples, when the chart is a phone's", () => {
    expect(edgeTicks(bins, (value) => value.toLocaleString("en-IN"), 358)).toEqual([0, 200, 400, 600, 800, 1000]);
  });
});

describe("placeMarks", () => {
  const plot = { x: 40, width: 300 };

  it("names two marks a few pixels apart away from each other, so neither name runs across the other's line", () => {
    const placed = placeMarks(
      [
        { x: 150, label: "zero" },
        { x: 153, label: "median" },
      ],
      plot,
    );
    expect(placed.map(({ label, side, row }) => [label, side, row])).toEqual([
      ["zero", "left", 0],
      ["median", "right", 0],
    ]);
  });

  it("keeps a name beside a mark at the plot's edge on the plot", () => {
    const [left] = placeMarks([{ x: 42, label: "today" }], plot);
    const [right] = placeMarks([{ x: 338, label: "p99" }], plot);
    expect([left?.side, right?.side]).toEqual(["right", "left"]);
  });

  it("drops a name with no room beside its line a line lower", () => {
    const placed = placeMarks(
      [
        { x: 100, label: "median" },
        { x: 120, label: "p90" },
        { x: 140, label: "p95" },
      ],
      plot,
    );
    const rows = new Set(placed.map(({ row }) => row));
    expect(rows.size).toBeGreaterThan(1);
    // No two names on one line overlap.
    const spans = placed.map(({ x, label, side, row }) => {
      const width = label.length * 7;
      return { row, from: side === "right" ? x + 4 : x - 4 - width, to: side === "right" ? x + 4 + width : x - 4 };
    });
    for (const a of spans)
      for (const b of spans) if (a !== b && a.row === b.row) expect(a.to <= b.from || b.to <= a.from).toBe(true);
  });
});

describe("HistogramChartCard's figures", () => {
  it("writes a mark below zero with the minus sign and the bucket edges' decimals when the page gives no formatter", () => {
    const html = renderToStaticMarkup(
      createElement(HistogramChartCard, { title: "Moves", height: 200, values: [-1.5, -0.5, 0.5], marks: ["median"] }),
    );
    expect(html).toContain("median \u22120.5<");
  });
});
