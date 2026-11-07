import { describe, expect, it } from "vite-plus/test";
import { histogram, markLines, percentile } from "../src/components/siyahi/histogram-chart";

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

describe("markLines", () => {
  it("draws marks that share a bucket as one line with one name", () => {
    const bins = histogram([100, 100, 100, 300], 2);
    const lines = markLines(bins, [
      { mark: "median", value: 100 },
      { mark: "p90", value: 240 },
      { mark: "p95", value: 270 },
    ]);
    expect(lines.map(({ x, label }) => [x, label])).toEqual([
      ["0", "median"],
      ["1", "p90, p95"],
    ]);
  });
});
