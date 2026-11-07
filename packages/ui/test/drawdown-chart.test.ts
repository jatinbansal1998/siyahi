import { describe, expect, it } from "vite-plus/test";
import { drawdowns } from "../src/components/siyahi/drawdown-chart";

const at = (levels: (number | null)[]) => drawdowns(levels.map((level, x) => ({ x, level })));

describe("drawdowns", () => {
  it("measures each level against the highest so far, zero at a new high", () => {
    expect(at([100, 120, 90, 130]).map(({ drawdown, peak }) => [drawdown, peak])).toEqual([
      [0, 100],
      [0, 120],
      [-0.25, 120],
      [0, 130],
    ]);
  });

  it("leaves a gap for an unknown level without moving the peak", () => {
    const [, gap, after] = at([100, Number.NaN, 80]);
    expect(gap).toMatchObject({ drawdown: null, level: null, peak: 100 });
    expect(after?.drawdown).toBeCloseTo(-0.2);
  });
});
