import { describe, expect, it } from "vite-plus/test";
import { waterfallBars } from "../src/components/siyahi/waterfall-chart";

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
      { kind: "fall", span: [140, 125], level: 125 },
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
});
