import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
beforeAll(async () => {
  catalogue = await openCatalogue("data/heatmaps", { viewport: { width: 390, height: 844 }, hasTouch: true });
}, 60_000);
afterAll(async () => catalogue?.close());

describe("heatmap interactions", () => {
  it("starts the weekday view at market hours with useful cells already in view", async () => {
    const heatmap = catalogue.page.locator('[data-slot="weekday-heatmap"]');
    await heatmap.scrollIntoViewIfNeeded();
    const first = heatmap.locator('[data-slot="weekday-heatmap-block"]').first();
    expect(await first.getAttribute("data-hour")).toBe("9");
    expect(Number(await first.getAttribute("data-value"))).toBeGreaterThan(0);
    expect(await heatmap.locator('[data-slot="weekday-heatmap-block"]').count()).toBe(35);
    expect(await heatmap.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
  });

  it("lets touch and keyboard readers inspect heatmap values through one tab entry", async () => {
    const { page } = catalogue;
    for (const kind of ["calendar", "weekday", "status"]) {
      const heatmap = page.locator(`[data-slot="${kind}-heatmap"]`);
      const buttons = heatmap.locator('rect[role="button"]');
      expect(await buttons.count()).toBeGreaterThan(0);
      await expect.poll(() => heatmap.locator('rect[role="button"][tabindex="0"]').count()).toBe(1);
      await buttons.first().focus();
      await page.keyboard.press("ArrowRight");
      const active = heatmap.locator('rect[role="button"][tabindex="0"]');
      const value = await active.getAttribute("data-value");
      const date = await active.getAttribute("data-date");
      await page.keyboard.press("Enter");
      const readout = heatmap.locator("..").locator('p[aria-live="polite"]');
      if (kind === "calendar") expect(await readout.textContent()).toBe(`${date}: ${value} trades`);
      else if (kind === "status")
        expect(await readout.textContent()).toBe(
          `${date}: ${["unknown", "critical", "degraded", "healthy"][Number(value)]}`,
        );
      else expect(await readout.textContent()).toBe(`Monday, 10:00 IST: ${value} orders`);
      await buttons.first().tap();
      expect(await readout.textContent()).not.toContain("Select a");
    }
  });

  it("rings the tapped cell on every heatmap, one at a time, and clears it on a second tap", async () => {
    const { page } = catalogue;
    for (const kind of ["calendar", "weekday", "status"]) {
      const heatmap = page.locator(`[data-slot="${kind}-heatmap"]`);
      const buttons = heatmap.locator('rect[role="button"]');
      const pressed = heatmap.locator('rect[aria-pressed="true"]');
      await buttons.nth(2).tap();
      await buttons.nth(3).tap();
      expect(await pressed.count()).toBe(1);
      expect(await pressed.getAttribute("data-value")).toBe(await buttons.nth(3).getAttribute("data-value"));
      expect(await pressed.evaluate((el) => (el as SVGRectElement).style.stroke)).toBe("var(--foreground)");
      await buttons.nth(3).tap();
      expect(await pressed.count()).toBe(0);
    }
  });
});
