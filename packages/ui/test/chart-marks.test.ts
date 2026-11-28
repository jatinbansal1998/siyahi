import { describe, expect, it } from "vite-plus/test";
import {
  QUIET,
  endLabelRoom,
  endLabelsFit,
  linesEndAtEdge,
  placeEnds,
  placeNotes,
  type LineEnd,
} from "../src/lib/chart-marks";

const plot = { x: 40, y: 12, width: 400, height: 200 };
const end = (name: string, x: number, y: number, quiet = false): LineEnd => ({
  id: name,
  name,
  color: quiet ? QUIET : "var(--chart-1)",
  x,
  y,
  quiet,
});

describe("placeEnds", () => {
  it("spreads names that crowd to 14px apart and keeps them inside the plot", () => {
    const placed = placeEnds([end("A", 440, 205), end("B", 440, 206), end("C", 440, 207)], plot);
    expect(placed.map(({ at }) => at)).toEqual([184, 198, 212]);
  });

  it("starts every name at the plot's right edge, with a leader from a line that ends short of it", () => {
    const placed = placeEnds([end("Short", 200, 100), end("Full", 440, 60)], plot);
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
    );
    expect(Math.min(...placed.map(({ at }) => at))).toBeGreaterThanOrEqual(short.y);
  });

  it("names every line, a quiet one too, at its own end's level", () => {
    const placed = placeEnds(
      [end("Q1", 440, 50, true), end("Q2", 440, 100, true), end("Q3", 440, 150, true), end("A", 440, 20)],
      plot,
    );
    expect(placed.map(({ name, at, quiet }) => [name, at, quiet])).toEqual([
      ["A", 20, false],
      ["Q1", 50, true],
      ["Q2", 100, true],
      ["Q3", 150, true],
    ]);
  });

  it("keeps two series of one name apart by their keys", () => {
    const placed = placeEnds(
      [
        { ...end("Same", 440, 40, true), id: "a" },
        { ...end("Same", 440, 120, true), id: "b" },
      ],
      plot,
    );
    expect(placed.map(({ id, name }) => [id, name])).toEqual([
      ["a", "Same"],
      ["b", "Same"],
    ]);
  });

  it("leaves out a point that maps to no number while a scale is replaced", () => {
    expect(placeEnds([end("A", Number.NaN, 20), end("B", 440, Number.POSITIVE_INFINITY)], plot)).toEqual([]);
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

// Notes are text-xs mono, 7px a character, 12px tall; flat marks at y = 150 unless a test says otherwise.
const flat = () => 150;
// Marks high right of x = 200 and low left of it.
const slope = (left: number) => (left >= 200 ? 50 : 150);

describe("placeNotes", () => {
  it("puts a note beside its rule just above the marks under it, on the lower side and inside the plot", () => {
    // The note at 200 goes left, where it can sit lower.
    const notes = [
      { index: 0, x: 200, text: "split" },
      { index: 1, x: 430, text: "end" },
    ];
    expect(placeNotes(notes, [200, 430], [], plot, slope).placed).toEqual([
      // Right of x = 430 the plot ends at 440, so "end" goes left of its rule too.
      { index: 1, x: 430, text: "end", left: 405, right: 426, top: 30, bottom: 42 },
      { index: 0, x: 200, text: "split", left: 161, right: 196, top: 130, bottom: 142 },
    ]);
  });

  it("stacks a note that would meet another above it, placing the shortest first", () => {
    const narrow = { ...plot, width: 200 };
    // The long note has no room right of its rule at 220 and meets "budget" left of it, so it climbs over.
    const notes = [
      { index: 0, x: 220, text: "new fund manager" },
      { index: 1, x: 100, text: "budget" },
    ];
    expect(placeNotes(notes, [100, 220], [], narrow, flat).placed).toEqual([
      { index: 1, x: 100, text: "budget", left: 104, right: 146, top: 130, bottom: 142 },
      { index: 0, x: 220, text: "new fund manager", left: 104, right: 216, top: 116, bottom: 128 },
    ]);
  });

  it("never crosses another event's rule, and hands back a note with no room as crowded", () => {
    // "budget" would cross the rule at 110 on its right and the unlabelled one at 60 on its left.
    const notes = [
      { index: 0, x: 100, text: "budget" },
      { index: 1, x: 110, text: "rate cut" },
    ];
    const { placed, crowded } = placeNotes(notes, [60, 100, 110], [], plot, flat);
    expect(placed.map(({ text, left }) => ({ text, left }))).toEqual([{ text: "rate cut", left: 114 }]);
    expect(crowded).toEqual([{ index: 0, x: 100, text: "budget" }]);
  });

  it("climbs over a limit's line rather than sitting on it", () => {
    const limit = { left: 40, right: 440, top: 99, bottom: 101 };
    const { placed } = placeNotes([{ index: 0, x: 200, text: "killed" }], [200], [limit], plot, () => 110);
    expect(placed.map(({ top, bottom }) => ({ top, bottom }))).toEqual([{ top: 85, bottom: 97 }]);
  });
});
