// Sorts the catalogue's data table from the keyboard in Chromium: happy-dom turns no Enter or Space into a click.
import type { Locator } from "playwright";
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let table: Locator;

beforeAll(async () => {
  catalogue = await openCatalogue("data/data-table");
  table = catalogue.page.locator('#data-table [data-slot="example"] table').first();
}, 60_000);

afterAll(async () => catalogue?.close());

const ariaSort = (column: string) => table.locator(`th[data-col-id="${column}"]`).getAttribute("aria-sort");

it("marks the sorted column's header with aria-sort as the keyboard sorts, and only that header", async () => {
  const { page } = catalogue;
  const revenue = table.getByRole("button", { name: /^Revenue/ });
  expect(await table.locator("th[aria-sort]").count()).toBe(0);

  await revenue.focus();
  await page.keyboard.press("Enter");
  expect(await ariaSort("revenue")).toBe("descending");
  await page.keyboard.press("Space");
  expect(await ariaSort("revenue")).toBe("ascending");
  expect(await revenue.textContent()).toBe("Revenue, sorted ascending");
  expect(await revenue.evaluate((el) => el === document.activeElement)).toBe(true);

  await table.getByRole("button", { name: /^Units/ }).focus();
  await page.keyboard.press("Enter");
  expect(await ariaSort("units")).toBe("descending");
  expect(await ariaSort("revenue")).toBeNull();
  expect(await table.locator("th[aria-sort]").count()).toBe(1);
});
