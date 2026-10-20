// @vitest-environment happy-dom
import { Treemap, type TreemapItem, type TreemapProps } from "@siyahi/ui";
import { act } from "react";
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

  it("reports the item under the pointer, and null when the pointer leaves", async () => {
    const onHover = vi.fn<(item: TreemapItem | null) => void>();
    const items = [
      { name: "INFY", weight: 300, change: 0.01 },
      { name: "TCS", weight: 200, change: -0.01 },
    ];
    await render({ height: 300, items, onHover });
    const rect = tile("TCS")?.querySelector("rect");
    await act(async () => rect?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })));
    expect(onHover).toHaveBeenLastCalledWith(items[1]);
    await act(async () =>
      rect?.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body })),
    );
    expect(onHover).toHaveBeenLastCalledWith(null);
  });
});
