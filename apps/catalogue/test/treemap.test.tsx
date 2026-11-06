// @vitest-environment happy-dom
import { Treemap, TreemapLegend, type TreemapItem, type TreemapProps } from "@siyahi/ui";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// happy-dom never measures, so every observed box reports 600px wide.
class FixedWidth {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(): void {
    this.callback([{ contentRect: { width: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve(): void {}
  disconnect(): void {}
}

let root: Root | undefined;

beforeEach(() => vi.stubGlobal("ResizeObserver", FixedWidth));

afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function render<T extends TreemapItem>(props: TreemapProps<T>): Promise<void> {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () => root?.render(<Treemap {...props} />));
}

const tiles = () => [...document.querySelectorAll<SVGSVGElement>('[data-slot="treemap-tile"]')];
const tile = (name: string) => tiles().find((t) => t.querySelector("tspan")?.textContent === name);
const fill = (name: string) => tile(name)?.querySelector("rect")?.style.fill;
const textFill = (name: string) => tile(name)?.querySelector("text")?.style.fill;
// Found by its aria-label, which keeps the whole name when the tile shows it cut short.
const lines = (name: string) => {
  const found = tiles().find((t) => t.getAttribute("aria-label")?.startsWith(`${name},`));
  expect(found).toBeDefined();
  return [...(found?.querySelectorAll("tspan") ?? [])];
};
const box = (el: Element | undefined) => ({
  x: Number(el?.getAttribute("x")),
  y: Number(el?.getAttribute("y")),
  right: Number(el?.getAttribute("x")) + Number(el?.getAttribute("width")),
});

// A browser fires pointerout on the element left and pointerover on the
// one entered; React derives onPointerEnter and onPointerLeave from them.
const move = async (from: Element | null | undefined, to: Element | null | undefined, pointerType = "mouse") =>
  act(async () => {
    from?.dispatchEvent(
      new PointerEvent("pointerout", { bubbles: true, pointerType, relatedTarget: to ?? document.body }),
    );
    to?.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, pointerType, relatedTarget: from ?? document.body }),
    );
  });

const tap = (el: Element | null | undefined) =>
  act(async () => {
    el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
const ringed = () =>
  tiles()
    .filter((t) => t.querySelectorAll("rect").length === 2)
    .map((t) => t.querySelector("tspan")?.textContent);

describe("Treemap", () => {
  it("offers one keyboard entry, arrow navigation and the same selection action as touch", async () => {
    const items = [
      { name: "INFY", weight: 300, change: 0.01 },
      { name: "TCS", weight: 200, change: -0.01 },
    ];
    const onSelect = vi.fn<(item: TreemapItem | null) => void>();
    await render({ height: 300, items, onSelect });
    const [first, second] = tiles();
    expect(first?.getAttribute("role")).toBe("button");
    expect(first?.getAttribute("tabindex")).toBe("0");
    expect(second?.getAttribute("tabindex")).toBe("-1");
    await act(async () => first?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(onSelect).toHaveBeenLastCalledWith(items[0]);
    await act(async () => first?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(second?.getAttribute("tabindex")).toBe("0");
    await act(async () => second?.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true })));
    expect(onSelect).toHaveBeenLastCalledWith(items[1]);
    await act(async () => second?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("draws each group's name above its own tiles", async () => {
    await render({
      height: 300,
      items: [
        { name: "INFY", group: "IT", weight: 300, change: 0.01 },
        { name: "TCS", group: "IT", weight: 200, change: 0.01 },
        { name: "HDFCBANK", group: "Banks", weight: 400, change: 0.01 },
      ],
    });
    const groups = [...document.querySelectorAll('[data-slot="treemap-group"]')];
    expect(groups.map((g) => g.querySelector("text")?.textContent)).toEqual(["IT", "Banks"]);
    const itGroup = box(groups[0]);
    for (const name of ["INFY", "TCS"]) {
      const t = box(tile(name));
      expect(t.x).toBeGreaterThanOrEqual(itGroup.x);
      expect(t.right).toBeLessThanOrEqual(itGroup.right);
      expect(t.y).toBeGreaterThanOrEqual(itGroup.y + 18);
    }
  });

  it("drops a group's name that its column cannot hold to the tooltip, never cutting it short", async () => {
    await render({
      height: 300,
      items: [
        { name: "INFY", group: "IT", weight: 950, change: 0.01 },
        { name: "LT", group: "Construction", weight: 50, change: 0.01 },
      ],
    });
    const narrow = [...document.querySelectorAll('[data-slot="treemap-group"]')].find(
      (g) => g.querySelector("title")?.textContent === "Construction",
    );
    expect(Number(narrow?.getAttribute("width"))).toBeLessThan("Construction".length * 6.6);
    expect(narrow?.querySelector("text")).toBeNull();
  });

  it("writes no text on a tile too narrow or too short to hold it", async () => {
    await render({
      height: 300,
      items: [
        { name: "BIG", weight: 940, change: 0.01 },
        { name: "SLIM", weight: 60, change: 0.01 },
      ],
    });
    const slim = tiles().find((t) => t.getAttribute("aria-label")?.startsWith("SLIM"));
    expect(Number(slim?.getAttribute("width"))).toBeLessThan(56);
    expect(slim?.querySelector("text")).toBeNull();
  });

  it("starts dark mode's heat above a faint tint, so the first step does not read as the card", async () => {
    await render({ height: 300, items: [{ name: "INFY", weight: 100, change: 0.001 }] });
    expect(fill("INFY")).toMatch(/^light-dark\(.*var\(--positive\) 14%.*, .*var\(--positive\) 22%.*\)$/);
  });

  it("writes the two brightest dark steps in the colour's own foreground, so their text stays readable", async () => {
    await render({
      height: 300,
      items: [
        { name: "MILD", weight: 100, change: 0.02 },
        { name: "BIG", weight: 100, change: 0.04 },
        { name: "DROP", weight: 100, change: -0.05 },
      ],
    });
    expect(textFill("MILD")).toBe("var(--foreground)");
    expect(textFill("BIG")).toBe("light-dark(var(--foreground), var(--positive-foreground))");
    expect(textFill("DROP")).toBe("light-dark(var(--foreground), var(--negative-foreground))");
  });

  it("never cuts a name its tile was sized to hold", async () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ name: `ZOMATO${i}`, weight: 100 + i * 37, change: 0.01 }));
    await render({ height: 300, items });
    for (const t of tiles()) {
      const width = Number(t.getAttribute("width"));
      const name = t.querySelector("tspan")?.textContent ?? "";
      // At the smallest text, 11px, a 7-letter name in capitals needs about 54px plus the tile's padding.
      if (width - 16 >= 7 * 11 * 0.7) expect(name).not.toContain("…");
    }
  });

  it("grows a large tile's name and leaves off a figure the tile cannot hold whole", async () => {
    await render({
      height: 300,
      items: [
        { name: "BIG", weight: 880, change: 0.01, detail: "+$55,668" },
        // About 66px wide: room for "\u221238.0%" under its name, not for the money.
        { name: "LT", weight: 120, change: -0.38, detail: "\u2212$1,243,210" },
      ],
    });
    const [name, change, detail] = lines("BIG");
    expect(Number(name?.getAttribute("font-size"))).toBeGreaterThan(Number(change?.getAttribute("font-size")));
    expect(Number(name?.getAttribute("font-size"))).toBeGreaterThan(12);
    expect(detail?.textContent).toBe("+$55,668");
    expect(lines("LT").map((l) => l.textContent)).toEqual(["LT", "\u221238.0%"]);
  });

  it("keys tiles by key, so one name at two brokers draws two tiles", async () => {
    const error = vi.spyOn(console, "error");
    await render({
      height: 300,
      items: [
        { name: "INFY", key: "INFY-kite", weight: 300, change: 0.02 },
        { name: "INFY", key: "INFY-dhan", weight: 200, change: -0.01 },
      ],
    });
    expect(tiles()).toHaveLength(2);
    expect(error).not.toHaveBeenCalled();
  });

  it("marks an unknown change with — on a muted tile", async () => {
    await render({ height: 300, items: [{ name: "LT", weight: 100, change: null }] });
    expect(tile("LT")?.textContent).toBe("LT—");
    expect(fill("LT")).toBe("var(--muted)");
  });

  it("spreads the heat steps across range", async () => {
    const items = [
      { name: "HALF", weight: 100, change: 0.3 },
      { name: "PAST", weight: 100, change: -0.9 },
    ];
    await render({ height: 300, items, range: 0.6 });
    expect(fill("HALF")).toContain("var(--positive) 42%");
    expect(fill("PAST")).toContain("var(--negative) 70%");
  });

  it("falls back to ±5% when range is not a positive number", async () => {
    for (const range of [0, -0.05, Number.NaN, Number.POSITIVE_INFINITY]) {
      await render({ height: 300, items: [{ name: "INFY", weight: 100, change: 0.03 }], range });
      expect(fill("INFY")).toContain("var(--positive) 42%");
      await act(async () => root?.unmount());
    }
  });

  it("keeps every tile inside the box when weights are negative or infinite", async () => {
    await render({
      height: 300,
      items: [
        { name: "INFY", weight: 100, change: 0.01 },
        { name: "TCS", weight: -40, change: 0.01 },
        { name: "ITC", weight: 50, change: 0.01 },
        { name: "SBIN", weight: Number.POSITIVE_INFINITY, change: 0.01 },
        { name: "LT", weight: Number.NaN, change: 0.01 },
      ],
    });
    expect(tiles().map((t) => t.querySelector("tspan")?.textContent)).toEqual(["INFY", "ITC"]);
    for (const t of tiles()) {
      const at = (name: string) => Number(t.getAttribute(name));
      expect(at("x")).toBeGreaterThanOrEqual(0);
      expect(at("y")).toBeGreaterThanOrEqual(0);
      expect(at("x") + at("width")).toBeLessThanOrEqual(600);
      expect(at("y") + at("height")).toBeLessThanOrEqual(300);
    }
  });

  it("reports each tile the pointer moves onto, then null on a group's name and off the map", async () => {
    const onHover = vi.fn<(item: TreemapItem | null) => void>();
    const items = [
      { name: "INFY", key: "INFY-kite", group: "IT", weight: 300, change: 0.01 },
      { name: "INFY", key: "INFY-dhan", group: "IT", weight: 200, change: -0.01 },
    ];
    await render({ height: 300, items, onHover });
    const [kite, dhan] = tiles().map((t) => t.querySelector("rect"));
    const label = document.querySelector('[data-slot="treemap-group"] rect');
    await move(undefined, kite);
    await move(kite, dhan);
    await move(dhan, label);
    await move(label, undefined);
    expect(onHover.mock.calls.map(([item]) => item?.key ?? null)).toEqual(["INFY-kite", "INFY-dhan", null, null]);
    expect(onHover.mock.calls[1]?.[0]).toBe(items[1]);
  });

  it("reports no hover for a finger, so a page's hover card does not open where it landed", async () => {
    const onHover = vi.fn<(item: TreemapItem | null) => void>();
    await render({ height: 300, items: [{ name: "INFY", group: "IT", weight: 300, change: 0.01 }], onHover });
    const infy = tiles()[0]?.querySelector("rect");
    await move(undefined, infy, "touch");
    await move(infy, undefined, "touch");
    expect(onHover).not.toHaveBeenCalled();
  });

  it("selects a tapped tile with a ring, and clears on a second tap or a tap anywhere else", async () => {
    const onSelect = vi.fn<(item: TreemapItem | null) => void>();
    const items = [
      { name: "INFY", group: "IT", weight: 300, change: 0.01 },
      { name: "TCS", group: "IT", weight: 200, change: -0.01 },
    ];
    // The page owns the selection, as the catalogue example does.
    function Page() {
      const [selected, setSelected] = useState<TreemapItem | null>(null);
      const select = (item: TreemapItem | null) => {
        onSelect(item);
        setSelected(item);
      };
      return <Treemap height={300} items={items} selected={selected} onSelect={select} />;
    }
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<Page />));
    await tap(tile("INFY")?.querySelector("rect"));
    expect(ringed()).toEqual(["INFY"]);
    await tap(tile("TCS")?.querySelector("text"));
    expect(ringed()).toEqual(["TCS"]);
    await tap(tile("TCS")?.querySelector("rect"));
    expect(ringed()).toEqual([]);
    await tap(tile("INFY")?.querySelector("rect"));
    await tap(document.querySelector('[data-slot="treemap-group"] rect'));
    expect(ringed()).toEqual([]);
    await tap(tile("INFY")?.querySelector("rect"));
    await tap(document.body);
    expect(ringed()).toEqual([]);
    expect(onSelect.mock.calls.map(([item]) => item?.name ?? null)).toEqual([
      "INFY",
      "TCS",
      null,
      "INFY",
      null,
      "INFY",
      null,
    ]);
  });
});

const swatch = (title: string) =>
  [...document.querySelectorAll('[data-slot="treemap-legend-swatch"]')]
    .find((s) => s.querySelector("title")?.textContent === title)
    ?.querySelector("rect")?.style.fill;

describe("TreemapLegend", () => {
  // Each swatch is titled with its span; a tile inside that span must take its colour.
  it("paints each step the colour of a tile whose change falls in its span", async () => {
    const items = [
      { name: "DEEP", weight: 100, change: -0.7 },
      { name: "MID", weight: 100, change: 0.3 },
      // 2.17 steps: ceil puts it in step 3 with MID, where rounding would drop it to step 2.
      { name: "EDGE", weight: 100, change: 0.26 },
      { name: "FLAT", weight: 100, change: 0 },
    ];
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <>
          <Treemap items={items} height={300} range={0.6} />
          <TreemapLegend range={0.6} />
        </>,
      ),
    );
    expect(swatch("down over 48%")).toBe(fill("DEEP"));
    expect(swatch("up 24%–36%")).toBe(fill("MID"));
    expect(swatch("up 24%–36%")).toBe(fill("EDGE"));
    expect(swatch("no change, or unknown")).toBe(fill("FLAT"));
    expect(document.querySelector('[data-slot="treemap-legend"]')?.textContent).toContain("12% a step");
  });
});
