import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;

beforeAll(async () => {
  catalogue = await openCatalogue("data/data-table");
}, 60_000);

afterAll(async () => catalogue?.close());

describe("responsive table", () => {
  it("keeps search inside the card on a small phone", async () => {
    const { page } = catalogue;
    await page.setViewportSize({ width: 320, height: 844 });
    const search = page.getByRole("textbox", { name: "Filter holdings", exact: true });
    const fits = await search.evaluate((el) => {
      const field = el.getBoundingClientRect();
      const card = el.closest('[data-slot="card"]')!.getBoundingClientRect();
      return field.left >= card.left && field.right <= card.right;
    });
    expect(fits).toBe(true);
  });

  it("scrolls the instrument away in narrow containers and restores freezing without losing search or sort", async () => {
    const { page } = catalogue;
    const section = page.locator('#data-table [data-slot="card"]').first();
    const scroll = section.locator('[data-slot="table-container"]');
    const instrument = section.locator('tbody td[data-col-id="symbol"]').first();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => instrument.evaluate((el) => getComputedStyle(el).position), { timeout: 1500 })
      .not.toBe("sticky");
    await scroll.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    expect(await instrument.evaluate((el) => el.getBoundingClientRect().right)).toBeLessThan(
      await scroll.evaluate((el) => el.getBoundingClientRect().left),
    );

    await scroll.evaluate((el) => (el.scrollLeft = 0));
    await section.getByRole("button", { name: "Value", exact: true }).click();
    await section.getByRole("textbox", { name: "Filter holdings" }).fill("INFY");
    await expect.poll(() => section.locator("tbody tr").count()).toBe(1);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    expect(await instrument.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    expect(await section.getByRole("textbox", { name: "Filter holdings" }).inputValue()).toBe("INFY");
    expect(await section.getByRole("button", { name: /Value.*sorted descending/ }).count()).toBe(1);

    await page.setViewportSize({ width: 1366, height: 900 });
    await scroll.evaluate((el) => (el.style.width = "20rem"));
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    expect(await instrument.evaluate((el) => getComputedStyle(el).position)).not.toBe("sticky");
    await scroll.focus();
    expect(await scroll.evaluate((el) => el === document.activeElement)).toBe(true);
  }, 30_000);

  it("shows only the key columns on a phone until the reader asks for all of them", async () => {
    const { page } = catalogue;
    const card = page.locator('#data-table [data-slot="card"]', { hasText: "Holdings on a phone" });
    const table = card.locator("table");
    const headers = () => table.locator("thead th").allInnerTexts();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (await headers()).join("|")).toBe("Symbol|Value");
    expect(await table.locator("tbody tr").first().innerText()).toContain("1.8%");
    await card.getByRole("button", { name: "All columns" }).click();
    await expect.poll(async () => (await headers()).length).toBe(5);
    await card.getByRole("button", { name: "Key columns" }).click();
    await expect.poll(async () => (await headers()).length).toBe(2);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect.poll(async () => (await headers()).length).toBe(5);
    expect(await card.getByRole("button", { name: "All columns" }).count()).toBe(0);
  }, 30_000);
});
