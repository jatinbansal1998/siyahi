import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/data-table");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("faceted filter labels", { timeout: 60_000 }, () => {
  it("shows full labels and counts within the viewport, and still searches and selects", async () => {
    for (const width of [1280, 390, 280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('[data-slot="popover-trigger"]').filter({ hasText: "Sector" }).click();
      const popup = page.locator('[data-slot="popover-content"]');
      const option = popup.getByRole("option", { name: /Fast Moving Consumer Goods/ });
      await option.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const layout = await option.evaluate((item) => {
        const label = [...item.querySelectorAll("span")].find(
          (span) => span.textContent === "Fast Moving Consumer Goods",
        );
        if (!label) throw new Error("missing sector label");
        const popupElement = item.closest('[data-slot="popover-content"]');
        if (!popupElement) throw new Error("missing filter popup");
        const box = popupElement.getBoundingClientRect();
        const count = label.nextElementSibling;
        return {
          clipped: label.scrollWidth > label.clientWidth || getComputedStyle(label).textOverflow === "ellipsis",
          left: box.left,
          right: box.right,
          count: count?.textContent,
          countFits: !!count && count.getBoundingClientRect().right <= box.right,
        };
      });
      expect(layout.clipped).toBe(false);
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.right).toBeLessThanOrEqual(width);
      expect(layout.count).toBe("1");
      expect(layout.countFits).toBe(true);
      await popup.getByRole("combobox").fill("Consumer Goods");
      expect(await popup.getByRole("option").count()).toBe(1);
      await option.click();
      expect(await page.locator("#data-table tbody tr").count()).toBe(1);
      expect(await page.locator("#data-table tbody tr").textContent()).toContain("ITC");
      await page.reload();
    }
  });
});
