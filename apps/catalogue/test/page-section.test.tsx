// Reads PageSection's spacing in Chromium, where Tailwind's classes are laid out.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("layout");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("PageSection", { timeout: 60_000 }, () => {
  it("sits 24px under its rule with 16px to its content and a 20px title", async () => {
    const section = page.locator('[data-slot="page-section"]').first();
    await section.waitFor();
    const spacing = await section.evaluate((el) => ({
      top: getComputedStyle(el).paddingTop,
      gap: getComputedStyle(el).rowGap,
      title: getComputedStyle(el.querySelector("h2") as Element).fontSize,
    }));
    expect(spacing).toEqual({ top: "24px", gap: "16px", title: "20px" });
  });
});
