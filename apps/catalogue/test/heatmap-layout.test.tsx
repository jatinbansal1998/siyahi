import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
beforeAll(async () => {
  catalogue = await openCatalogue("data/heatmaps", { viewport: { width: 1440, height: 900 } });
}, 60_000);
afterAll(async () => catalogue?.close());

/** How much of its card's content width each heatmap's drawing fills, as a fraction. */
const fill = (slot: string) =>
  catalogue.page
    .locator(`[data-slot="${slot}-body"] svg`)
    .first()
    .evaluate((svg) => {
      const content = svg.closest('[data-slot="card-content"]')!;
      const padding = Number.parseFloat(getComputedStyle(content).paddingLeft) * 2;
      return svg.getBoundingClientRect().width / (content.clientWidth - padding);
    });

describe("heatmap layout", () => {
  it("sizes the calendar's and the status strip's cells from the card, so each spans it", async () => {
    expect(await fill("calendar-heatmap")).toBeGreaterThan(0.97);
    expect(await fill("status-heatmap")).toBeGreaterThan(0.99);
    const square = await catalogue.page
      .locator('[data-slot="calendar-heatmap-block"]')
      .first()
      .evaluate((cell) => cell.getAttribute("width") === cell.getAttribute("height"));
    expect(square).toBe(true);
  });

  it("draws the last 12 months as one strip, the year a tick at January", async () => {
    const svgs = catalogue.page.locator('[data-slot="calendar-heatmap-body"] svg');
    expect(await svgs.count()).toBe(1);
    const ticks = await svgs.locator("text").allTextContents();
    expect(ticks).toContain("2026");
    expect(ticks).not.toContain("Jan");
  });

  it("keeps a low-to-high legend with its unit on every heatmap, on a phone too", async () => {
    const { page } = catalogue;
    await page.setViewportSize({ width: 390, height: 844 });
    const legend = (slot: string) => page.locator(`[data-slot="${slot}-legend"]`).first();
    await expect.poll(() => legend("calendar-heatmap").textContent()).toMatch(/0 trades.*5 trades/);
    expect(await legend("weekday-heatmap").textContent()).toMatch(/0 orders.*13 orders an hour/);
    expect(await legend("status-heatmap").textContent()).toBe("HealthyDegradedCritical");
    for (const slot of ["calendar-heatmap", "weekday-heatmap", "status-heatmap"]) {
      expect(await legend(slot).isVisible()).toBe(true);
    }
  });
});
