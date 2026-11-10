import { describe, expect, it } from "vite-plus/test";
import { QUIET, endLabelRoom, endLabelsFit, linesEndAtEdge, placeEnds, type LineEnd } from "../src/lib/chart-marks";

const plot = { x: 40, y: 12, width: 400, height: 200 };
const end = (name: string, x: number, y: number, quiet = false): LineEnd => ({
  name,
  color: quiet ? QUIET : "var(--chart-1)",
  x,
  y,
  quiet,
});

describe("placeEnds", () => {
  it("spreads names that crowd to 14px apart and keeps them inside the plot", () => {
    const placed = placeEnds([end("A", 440, 205), end("B", 440, 206), end("C", 440, 207)], plot, "others");
    expect(placed.map(({ at }) => at)).toEqual([184, 198, 212]);
  });

  it("starts every name at the plot's right edge, with a leader from a line that ends short of it", () => {
    const placed = placeEnds([end("Short", 200, 100), end("Full", 440, 60)], plot, "others");
    const short = placed.find(({ name }) => name === "Short");
    const full = placed.find(({ name }) => name === "Full");
    expect([short?.name, short?.gutter, short?.leader]).toEqual(["Short", 440, true]);
    expect([full?.name, full?.gutter, full?.leader]).toEqual(["Full", 440, false]);
  });

  it("never puts a name above a plot too short to hold them all", () => {
    const short = { x: 40, y: 12, width: 400, height: 28 };
    const placed = placeEnds(
      ["A", "B", "C", "D", "E"].map((name) => end(name, 440, 40)),
      short,
      "others",
    );
    expect(Math.min(...placed.map(({ at }) => at))).toBeGreaterThanOrEqual(short.y);
  });

  it("folds quiet series into one name at the middle one's level", () => {
    const placed = placeEnds(
      [end("Q1", 440, 50, true), end("Q2", 440, 100, true), end("Q3", 440, 150, true), end("A", 440, 20)],
      plot,
      "other funds",
    );
    expect(placed.map(({ name, at }) => [name, at])).toEqual([
      ["A", 20],
      ["3 other funds", 100],
    ]);
  });

  it("leaves out a point that maps to no number while a scale is replaced", () => {
    expect(placeEnds([end("A", Number.NaN, 20), end("B", 440, Number.POSITIVE_INFINITY)], plot, "others")).toEqual([]);
  });
});

describe("linesEndAtEdge", () => {
  const series = [
    { key: "a", label: "Alpha", color: "var(--chart-1)" },
    { key: "b", label: "Beta", color: "var(--chart-2)" },
  ] as const;

  it("names the ends when every line has a value in the last row", () => {
    expect(
      linesEndAtEdge(
        [
          { x: 1, a: 1, b: 2 },
          { x: 2, a: 3, b: 4 },
        ],
        "x",
        series,
      ),
    ).toBe(true);
  });

  it("keeps the legend for a line that stops short, a single point, or an axis running past the data", () => {
    expect(
      linesEndAtEdge(
        [
          { x: 1, a: 1, b: 2 },
          { x: 2, a: null, b: 4 },
        ],
        "x",
        series,
      ),
    ).toBe(false);
    expect(linesEndAtEdge([{ x: 1, a: 1, b: 2 }], "x", series)).toBe(false);
    expect(
      linesEndAtEdge(
        [
          { x: 0, a: 1, b: 2 },
          { x: 20, a: 3, b: 4 },
        ],
        "x",
        series,
        [0, 100],
      ),
    ).toBe(false);
  });
});

describe("endLabelsFit", () => {
  it("names the ends on a card wide and tall enough", () => {
    expect(endLabelsFit(["Nifty 50", "Gold"], 460, 214)).toBe(true);
  });

  it("keeps the legend on a phone, for names too wide, and on a plot too short", () => {
    expect(endLabelsFit(["Nifty 50", "Gold"], 326, 214)).toBe(false);
    // Thirty wide letters take more than 30% of the card; the room is measured, not guessed at 6px a letter.
    expect(endLabelsFit(["W".repeat(30)], 788, 214)).toBe(false);
    expect(endLabelsFit(["A", "B", "C", "D", "E"], 788, 28)).toBe(false);
  });

  it("reserves room for the widest name after its leader and square", () => {
    expect(endLabelRoom(["W".repeat(30)])).toBeGreaterThan(30 * 7);
  });
});
