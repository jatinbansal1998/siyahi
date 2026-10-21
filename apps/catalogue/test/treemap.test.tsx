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
const box = (el: Element | undefined) => ({
  x: Number(el?.getAttribute("x")),
  y: Number(el?.getAttribute("y")),
  right: Number(el?.getAttribute("x")) + Number(el?.getAttribute("width")),
});

// A browser fires pointerout on the element left and pointerover on the
// one entered; React derives onPointerEnter and onPointerLeave from them.
const move = async (from: Element | null | undefined, to: Element | null | undefined) =>
  act(async () => {
    from?.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: to ?? document.body }));
    to?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, relatedTarget: from ?? document.body }));
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
    expect(groups.map((g) => g.textContent)).toEqual(["IT", "Banks"]);
    const itGroup = box(groups[0]);
    for (const name of ["INFY", "TCS"]) {
      const t = box(tile(name));
      expect(t.x).toBeGreaterThanOrEqual(itGroup.x);
      expect(t.right).toBeLessThanOrEqual(itGroup.right);
      expect(t.y).toBeGreaterThanOrEqual(itGroup.y + 18);
    }
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
    expect(fill("HALF")).toContain("var(--positive) 36%");
    expect(fill("PAST")).toContain("var(--negative) 60%");
  });

  it("falls back to ±5% when range is not a positive number", async () => {
    for (const range of [0, -0.05, Number.NaN, Number.POSITIVE_INFINITY]) {
      await render({ height: 300, items: [{ name: "INFY", weight: 100, change: 0.03 }], range });
      expect(fill("INFY")).toContain("var(--positive) 36%");
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
