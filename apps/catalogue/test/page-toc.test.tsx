import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;

beforeAll(async () => {
  catalogue = await openCatalogue("components");
}, 60_000);

afterAll(async () => catalogue?.close());

describe("page sections strip", () => {
  it("stays under the header and marks the section the reader is in", async () => {
    const { page } = catalogue;
    const strip = page.getByRole("navigation", { name: "On this page" });
    const current = () => strip.locator('[aria-current="location"]').innerText();
    await expect.poll(current).toBe("Button");

    await strip.getByRole("link", { name: "Tabs", exact: true }).click();
    await expect.poll(current, { timeout: 5000 }).toBe("Tabs");
    expect(await strip.evaluate((el) => el.getBoundingClientRect().top)).toBe(56);
    expect(await page.evaluate(() => location.hash)).toBe("#/components");
  }, 30_000);
});
