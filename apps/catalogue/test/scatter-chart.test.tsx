// The scatter chart example in Chromium: names placed from real laid-out boxes, the tooltip and tap to select.
// happy-dom cannot do this: Recharts lays the plot out from measured sizes.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/scatter-chart");
  page = catalogue.page;
  await page.locator('[data-slot="scatter-labels"] text').first().waitFor();
}, 60_000);

afterAll(async () => catalogue?.close());

interface Rect {
  name: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Every name's box and every dot's box, as the browser laid them out. */
const layout = async () => ({
  labels: await page.$$eval('[data-slot="scatter-labels"] text', (els) =>
    els.map((el) => {
      const { left, top, right, bottom } = el.getBoundingClientRect();
      return { name: el.textContent ?? "", left, top, right, bottom };
    }),
  ),
  dots: await page.$$eval('[data-slot="scatter-point"]', (els) =>
    els.map((el) => {
      const { left, top, right, bottom } = el.getBoundingClientRect();
      return { name: el.getAttribute("aria-label") ?? "", left, top, right, bottom };
    }),
  ),
});

/** Waits until the chart has re-laid itself out after a resize: two reads in a row agree. */
async function settled(): Promise<Awaited<ReturnType<typeof layout>>> {
  let last = "";
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await layout());
        const same = now === last && JSON.parse(now).dots.length > 0;
        last = now;
        return same;
      },
      { interval: 250, timeout: 5000 },
    )
    .toBe(true);
  return JSON.parse(last);
}

const overlap = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe("ScatterChartCard", () => {
  for (const width of [1280, 390]) {
    it(`never puts a name on another name or on another store's dot at ${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 });
      const { labels, dots } = await settled();
      expect(labels.length).toBeGreaterThan(5);
      for (const [i, a] of labels.entries()) {
        for (const b of labels.slice(i + 1)) expect(overlap(a, b), `${a.name} on ${b.name}`).toBe(false);
        for (const dot of dots.filter((d) => !d.name.startsWith(`${a.name},`)))
          expect(overlap(a, dot), `${a.name} on ${dot.name}'s dot`).toBe(false);
      }
    });
  }

  it("draws the names above the dots", async () => {
    const order = await page.evaluate(() =>
      [...document.querySelectorAll('[data-slot="scatter-point"], [data-slot="scatter-labels"]')].map(
        (el) => el.getAttribute("data-slot") ?? "",
      ),
    );
    expect(order.at(-1)).toBe("scatter-labels");
  });

  it("leaves out the store with no growth", async () => {
    const { dots } = await layout();
    expect(dots).toHaveLength(19);
    expect(dots.some((d) => d.name.startsWith("Guwahati,"))).toBe(false);
  });

  it("shows a hovered dot's name and figures", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await settled();
    const kochi = page.locator('[data-slot="scatter-point"][data-key="Kochi"]');
    const box = await kochi.boundingBox();
    if (!box) throw new Error("Kochi is not laid out");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const tooltip = page.locator('[data-slot="scatter-chart"] .recharts-tooltip-wrapper');
    await expect.poll(() => tooltip.innerText()).toContain("Kochi");
    expect((await tooltip.innerText()).split("\n").filter(Boolean)).toEqual([
      "Kochi",
      "Region",
      "South",
      "Sales",
      "₹8,70,000",
      "Growth",
      "+58.0%",
    ]);
  });

  it("rings a tapped dot and prints its figures, and a second tap or a tap on the plot clears it", async () => {
    const kochi = page.locator('[data-slot="scatter-point"][data-key="Kochi"]');
    const selection = page.locator('[data-slot="scatter-selection"]');
    await kochi.click();
    await expect.poll(() => kochi.getAttribute("data-selected")).toBe("true");
    expect(await selection.innerText()).toContain("Kochi");
    await kochi.click();
    await expect.poll(() => kochi.getAttribute("data-selected")).toBe(null);
    await kochi.click();
    const plot = await page.locator('[data-slot="scatter-chart"] .recharts-cartesian-grid').boundingBox();
    if (!plot) throw new Error("no plot");
    await page.mouse.click(plot.x + 8, plot.y + plot.height - 8);
    await expect.poll(() => kochi.getAttribute("data-selected")).toBe(null);
    expect(await selection.innerText()).toBe("Tap a dot for its figures");
  });
  it("walks the dots with the arrow keys, left to right, and selects with Enter and clears with Escape", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await settled();
    const first = page.locator('[data-slot="scatter-point"][tabindex="0"]');
    await first.focus();
    // Home goes to Shillong, the smallest share of sales; Nagpur is next to the right.
    await page.keyboard.press("Home");
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute("data-key"));
    expect(await focused()).toBe("Shillong");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
      "Shillong, Region Northeast, Sales ₹1,00,000, Growth −18.0%",
    );
    await page.keyboard.press("ArrowRight");
    expect(await focused()).toBe("Nagpur");
    await page.keyboard.press("Enter");
    const nagpur = page.locator('[data-slot="scatter-point"][data-key="Nagpur"]');
    await expect.poll(() => nagpur.getAttribute("aria-pressed")).toBe("true");
    expect(await page.locator('[data-slot="scatter-selection"]').innerText()).toContain("Nagpur");
    await page.keyboard.press("Escape");
    await expect.poll(() => nagpur.getAttribute("aria-pressed")).toBe("false");
  });

  it("moves the tooltip to the dot under a finger as it drags", async () => {
    const at = async (name: string) => {
      const box = await page.locator(`[data-slot="scatter-point"][aria-label^="${name},"]`).boundingBox();
      if (!box) throw new Error(`${name} is not laid out`);
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const tooltip = page.locator('[data-slot="scatter-chart"] .recharts-tooltip-wrapper');
    // Not Kochi: Escape in the test before dismissed the tooltip, and Recharts keeps it dismissed on the same dot.
    const surat = await at("Surat");
    await page.mouse.move(0, 0);
    await page.mouse.move(surat.x, surat.y, { steps: 5 });
    await expect.poll(() => tooltip.innerText()).toContain("Surat");
    const jaipur = await at("Jaipur");
    await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y);
      if (!target) throw new Error("nothing under the finger");
      const touch = new Touch({ identifier: 1, target, clientX: x, clientY: y });
      target.dispatchEvent(
        new TouchEvent("touchmove", { bubbles: true, cancelable: true, touches: [touch], changedTouches: [touch] }),
      );
    }, jaipur);
    await expect.poll(() => tooltip.innerText()).toContain("Jaipur");
  });

  it("keeps names apart when the reader enlarges the text", async () => {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "24px";
    });
    // A resize makes the chart lay itself out again with the larger type.
    await page.setViewportSize({ width: 1279, height: 900 });
    const { labels, dots } = await settled();
    expect(labels.length).toBeGreaterThan(2);
    for (const [i, a] of labels.entries()) {
      for (const b of labels.slice(i + 1)) expect(overlap(a, b), `${a.name} on ${b.name}`).toBe(false);
      for (const dot of dots.filter((d) => !d.name.startsWith(`${a.name},`)))
        expect(overlap(a, dot), `${a.name} on ${dot.name}'s dot`).toBe(false);
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
  });
});
