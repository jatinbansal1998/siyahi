import { describe, expect, it } from "vite-plus/test";
import { corners, dotSizes, placeLabels, quadrantSplit, type LabelCandidate } from "../src/lib/scatter";

const plot = { x: 0, y: 0, width: 400, height: 300 };
// A fixed 7px a character stands in for the canvas, which happy-dom does not have.
const measure = (text: string) => text.length * 7;
const type = { size: 12, measure };

const dot = (key: string, cx: number, cy: number, r = 5): LabelCandidate => ({ key, text: key, cx, cy, r });

describe("placeLabels", () => {
  it("puts a name right of its dot when there is room", () => {
    expect(placeLabels([dot("Kochi", 100, 100)], plot, 12, type)).toEqual([
      { key: "Kochi", text: "Kochi", x: 111, y: 104 },
    ]);
  });

  it("moves a name left of its dot at the plot's right edge", () => {
    const [label] = placeLabels([dot("Kochi", 395, 100)], plot, 12, type);
    expect(label?.x).toBeLessThan(395);
  });

  it("never lets two names overlap: a crowded dot's name goes elsewhere or is left out", () => {
    // A column of dots 14px apart: one line of type is 16px, so names right of each dot would overlap their neighbours.
    const column = Array.from({ length: 10 }, (_, i) => dot(`Store ${i}`, 200, 60 + i * 14));
    const placed = placeLabels(column, plot, 10, type);
    const boxes = placed.map((l) => ({ x: l.x, y: l.y - 12, right: l.x + measure(l.text), bottom: l.y + 4 }));
    expect(placed.length).toBeGreaterThan(3);
    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1))
        expect(a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom).toBe(false);
  });

  it("keeps a name off another dot", () => {
    // A dot just right of Kochi takes the right-hand spot, so the name goes left.
    const [label] = placeLabels([dot("Kochi", 100, 100), dot("x", 130, 100)], plot, 1, type);
    expect(label?.x).toBeLessThan(100);
  });

  it("labels the earliest points first, up to the limit", () => {
    const points = [dot("A", 50, 50), dot("B", 50, 150), dot("C", 50, 250)];
    expect(placeLabels(points, plot, 2, type).map((l) => l.key)).toEqual(["A", "B"]);
  });

  it("keeps a name clear of a big neighbour's whole dot, not just a small dot's worth of it", () => {
    // B's 30px dot reaches left to x 130; A's name, right of A from x 59, would run into it there.
    const [label] = placeLabels([dot("Alpha store", 50, 100), dot("B", 160, 100, 30)], plot, 1, type);
    expect(label?.x).toBeLessThan(50);
  });

  it("keeps names off a reserved box, such as a quadrant's name", () => {
    const [label] = placeLabels([dot("Kochi", 100, 100)], plot, 1, type, [{ x: 100, y: 80, width: 200, height: 40 }]);
    expect(label?.x).toBeLessThan(100);
  });
});

describe("dotSizes", () => {
  it("gives a size that is not a positive number the smallest dot, leaving the others as they were", () => {
    const { radiusOf } = dotSizes(
      [{ size: Number.NaN }, { size: Number.POSITIVE_INFINITY }, { size: 100 }, { size: 25 }],
      5,
    );
    expect([Number.NaN, Number.POSITIVE_INFINITY, 100, 25].map((size) => radiusOf({ size }))).toEqual([3, 3, 20, 10]);
  });
});

describe("dotSizes when every size is bad", () => {
  it("draws every dot at the smallest size, not the plain one", () => {
    const { radiusOf, sized } = dotSizes([{ size: 0 }, { size: Number.NaN }, { size: -4 }], 5);
    expect(sized).toBe(true);
    expect([0, Number.NaN, -4].map((size) => radiusOf({ size }))).toEqual([3, 3, 3]);
  });
});

describe("quadrantSplit", () => {
  it("draws no split a log axis cannot place", () => {
    expect(quadrantSplit({ x: 0, y: 0 }, "log")).toBeUndefined();
    expect(quadrantSplit({ x: 1, y: 0 }, "log")).toEqual({ x: 1, y: 0 });
    expect(quadrantSplit({ x: Number.NaN, y: 0 }, "linear")).toBeUndefined();
  });
});

describe("corners", () => {
  const names = { topLeft: "Cheaper, selling more", topRight: "Dearer, still selling more" };

  it("keeps each name inside its own quadrant, so the two on one edge never meet", () => {
    const placed = corners(plot, names, { x: 200, y: 150 }, type);
    const [left, right] = placed.map(({ box }) => box);
    expect(left!.x + left!.width).toBeLessThanOrEqual(200);
    expect(right!.x).toBeGreaterThanOrEqual(200);
  });

  it("leaves out a name that will not fit its quadrant in two lines", () => {
    // The split sits 40px from the left edge: "Cheaper, selling more" cannot fit 28px, its neighbour fits.
    expect(corners(plot, names, { x: 40, y: 150 }, type).map(({ key }) => key)).toEqual(["right-top"]);
  });
});
