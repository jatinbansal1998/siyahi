import { describe, expect, it } from "vite-plus/test";
import { histogram, percentile } from "../src/components/siyahi/histogram-chart";

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

describe("percentile", () => {
  it("interpolates between the two nearest values, as a spreadsheet's PERCENTILE does", () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0.95)).toBeCloseTo(38.5);
  });
});
