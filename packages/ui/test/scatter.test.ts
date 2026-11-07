import { describe, expect, it } from "vite-plus/test";
import { linearTicks, logTicks, placeLabels, type LabelCandidate } from "../src/lib/scatter";

const plot = { x: 0, y: 0, width: 400, height: 300 };
// A fixed 7px a character stands in for the canvas, which happy-dom does not have.
const measure = (text: string) => text.length * 7;
const type = { size: 12, measure };

describe("logTicks", () => {
  it("runs 1, 2, 5 from the largest at or under the smallest value to the smallest at or over the largest", () => {
    expect(logTicks(0.004, 0.112)).toEqual([0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2]);
  });

  it("starts on a value that is itself a tick", () => {
    expect(logTicks(0.01, 0.05)).toEqual([0.01, 0.02, 0.05]);
  });
});

describe("linearTicks", () => {
  it("covers the data in a 1, 2, 2.5 or 5 step instead of overshooting it", () => {
    expect(linearTicks(-0.33, 0.58)).toEqual([-0.5, -0.25, 0, 0.25, 0.5, 0.75]);
  });

  it("starts and ends on the data's own values when they fall on a step", () => {
    expect(linearTicks(0.3, 0.4)).toEqual([0.3, 0.325, 0.35, 0.375, 0.4]);
  });

  it("stops at the data's end instead of adding a near-zero tick past it", () => {
    expect(linearTicks(-0.5, -0.1)).toEqual([-0.5, -0.4, -0.3, -0.2, -0.1]);
  });

  it("gives values that differ only by float noise one tick, and returns", () => {
    expect(linearTicks(0.3, 0.30000000000000004)).toEqual([0.3]);
  });
});

const dot = (key: string, cx: number, cy: number): LabelCandidate => ({ key, text: key, cx, cy });

describe("placeLabels", () => {
  it("puts a name right of its dot when there is room", () => {
    expect(placeLabels([dot("Kochi", 100, 100)], plot, 12, 5, type)).toEqual([
      { key: "Kochi", text: "Kochi", x: 111, y: 104 },
    ]);
  });

  it("moves a name left of its dot at the plot's right edge", () => {
    const [label] = placeLabels([dot("Kochi", 395, 100)], plot, 12, 5, type);
    expect(label?.x).toBeLessThan(395);
  });

  it("never lets two names overlap: a crowded dot's name goes elsewhere or is left out", () => {
    // A column of dots 14px apart: one line of type is 16px, so names right of each dot would overlap their neighbours.
    const column = Array.from({ length: 10 }, (_, i) => dot(`Store ${i}`, 200, 60 + i * 14));
    const placed = placeLabels(column, plot, 10, 5, type);
    const boxes = placed.map((l) => ({ x: l.x, y: l.y - 12, right: l.x + measure(l.text), bottom: l.y + 4 }));
    expect(placed.length).toBeGreaterThan(3);
    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1))
        expect(a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom).toBe(false);
  });

  it("keeps a name off another dot", () => {
    // A dot just right of Kochi takes the right-hand spot, so the name goes left.
    const [label] = placeLabels([dot("Kochi", 100, 100), dot("x", 130, 100)], plot, 1, 5, type);
    expect(label?.x).toBeLessThan(100);
  });

  it("labels the earliest points first, up to the limit", () => {
    const points = [dot("A", 50, 50), dot("B", 50, 150), dot("C", 50, 250)];
    expect(placeLabels(points, plot, 2, 5, type).map((l) => l.key)).toEqual(["A", "B"]);
  });
});
