// The Linear and Log buttons on the catalogue's chart examples in Chromium: the axis ticks and the plot follow the
// pick. happy-dom cannot do this: Recharts lays the axes out from measured sizes.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { chartDrawn, openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/scatter-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => catalogue?.close());

/**
 * Opens a family's page. Its examples load as the page opens, which on a busy machine takes longer than a test is
 * given (#110), so each family opens before its tests, as the first page does.
 */
async function show(family: string): Promise<void> {
  await page.evaluate((next) => {
    location.hash = next;
  }, `#/data/${family}`);
  await page.locator(`#${family} [data-slot="example-preview"]`).first().waitFor();
}

const card = (title: string): Locator =>
  page.locator('[data-slot="card"]', { has: page.getByText(title, { exact: true }) });

/** The tick labels along one axis, in order. */
const ticks = (chart: Locator, axis: "x" | "y") =>
  chart.locator(`.recharts-${axis === "x" ? "x" : "y"}Axis-tick-labels text`).allTextContents();

/** Waits until `scale` has `name` pressed and the chart has drawn on that scale. */
async function drawnOn(chart: Locator, scale: Locator, name: "Linear" | "Log"): Promise<void> {
  await scale.getByRole("button", { name, pressed: true }).waitFor();
  await chartDrawn(chart, ".recharts-surface");
}

describe("scale toggle", { timeout: 60_000 }, () => {
  // The first page opened on the scatter chart family.
  describe("on a scatter chart", () => {
    it("opens a scatter chart on the page's log scale, then ticks and redraws in round linear steps on Linear", async () => {
      const stores = card("Stores by size and growth");
      const scale = stores.getByRole("group", { name: "Share of sales scale" });
      await drawnOn(stores, scale, "Log");
      expect(await ticks(stores, "x")).toEqual(["0.2%", "0.5%", "1.0%", "2.0%", "5.0%", "10.0%", "20.0%"]);
      const shillong = stores.locator('[data-slot="scatter-point"][data-key="Shillong"]');
      const before = Number(await shillong.getAttribute("cx"));

      await scale.getByRole("button", { name: "Linear" }).click();

      await drawnOn(stores, scale, "Linear");
      expect(await ticks(stores, "x")).toEqual(["0.0%", "5.0%", "10.0%", "15.0%"]);
      // 0.4% sits a third of the way along a log axis from 0.2% to 20%, but hard against 0% on a linear one.
      expect(Number(await shillong.getAttribute("cx"))).toBeLessThan(before - 50);
    });

    it("switches a scatter chart's y axis, moving the dots, the quadrant split and the names with it", async () => {
      const products = card("A few cheap products sell most of the units");
      // Two pairs of buttons, each shown with its axis' name.
      const header = products.locator('[data-slot="card-action"]');
      const price = products.getByRole("group", { name: "Price scale" });
      await drawnOn(products, price, "Log");
      expect(await header.locator('[data-slot="scale-toggle"] > span').allTextContents()).toEqual([
        "Units sold",
        "Price",
      ]);
      const split = products.locator(".recharts-reference-line line").nth(1);
      const coffee = products.locator('[data-slot="scatter-point"][data-key="Coffee 200 g"]');
      expect(await ticks(products, "y")).toEqual(["₹20", "₹50", "₹100", "₹200", "₹500", "₹1,000", "₹2,000", "₹5,000"]);
      const before = { split: Number(await split.getAttribute("y1")), coffee: Number(await coffee.getAttribute("cy")) };

      await price.getByRole("button", { name: "Linear" }).click();

      await drawnOn(products, price, "Linear");
      expect(await ticks(products, "y")).toEqual(["₹0", "₹2,000", "₹4,000", "₹6,000"]);
      // ₹500 and ₹480 coffee sit mid-plot on log from ₹20 to ₹5,000, but low on linear from ₹0 to ₹6,000.
      expect(Number(await split.getAttribute("y1"))).toBeGreaterThan(before.split + 40);
      expect(Number(await coffee.getAttribute("cy"))).toBeGreaterThan(before.coffee + 40);
      const boxes = await products
        .locator('[data-slot="scatter-labels"] text')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
      const overlaps = boxes.some((a, i) =>
        boxes.some((b, j) => i < j && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom),
      );
      expect(boxes.length).toBeGreaterThan(3);
      expect(overlaps).toBe(false);
    });

    it("keeps a scatter chart's last x label inside the chart, as 50,000 on a log axis", async () => {
      const products = card("A few cheap products sell most of the units");
      await chartDrawn(products, ".recharts-xAxis-tick-labels text");
      const last = products.locator(".recharts-xAxis-tick-labels text").last();
      expect(await last.textContent()).toBe("50,000");
      const label = await last.boundingBox();
      const chart = await products.locator("svg.recharts-surface").boundingBox();
      expect(label && chart && label.x + label.width).toBeLessThanOrEqual((chart?.x ?? 0) + (chart?.width ?? 0));
    });
  });

  describe("on a line chart", () => {
    beforeAll(() => show("line-chart"), 60_000);

    it("switches a line chart's value axis from the keyboard", async () => {
      const users = card("Active users grew about 1.5× a month all year");
      const scale = users.getByRole("group", { name: "Active users scale" });
      await drawnOn(users, scale, "Log");
      expect(await ticks(users, "y")).toEqual(["200", "500", "1,000", "2,000", "5,000", "10,000", "20,000", "50,000"]);

      await scale.getByRole("button", { name: "Log" }).focus();
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("Space");

      await drawnOn(users, scale, "Linear");
      // On linear the axis just covers the 46,800 peak (issue #84); Recharts' own five ticks ran on to 80,000.
      expect(await ticks(users, "y")).toEqual(["0", "10,000", "20,000", "30,000", "40,000", "50,000"]);
    });
  });

  describe("on an area chart", () => {
    beforeAll(() => show("area-chart"), 60_000);

    it("opens an area chart on linear when the page sets no scale, with the range toggle beside the buttons", async () => {
      const managed = card("₹3.1 Cr managed a year after launch");
      const scale = managed.getByRole("group", { name: "Value axis scale" });
      await drawnOn(managed, scale, "Linear");
      const range = await managed.getByRole("group", { name: "Range" }).boundingBox();
      const buttons = await scale.boundingBox();
      expect(range && buttons && Math.abs(range.y - buttons.y)).toBeLessThan(2);
    });

    it("switches an area chart to log, each tick in its own unit, the fill reaching the plot's foot", async () => {
      const managed = card("₹3.1 Cr managed a year after launch");
      const scale = managed.getByRole("group", { name: "Value axis scale" });
      await scale.getByRole("button", { name: "Log" }).click();

      await drawnOn(managed, scale, "Log");
      expect(await ticks(managed, "y")).toEqual(["₹2L", "₹5L", "₹10L", "₹20L", "₹50L", "₹1 Cr", "₹2 Cr", "₹5 Cr"]);
      const fill = await managed.locator(".recharts-area-area").first().getAttribute("d");
      expect(fill).toMatch(/^M[\d.,\sLCZ-]+$/);
    });
  });
});
