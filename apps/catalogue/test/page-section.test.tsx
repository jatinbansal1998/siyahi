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

describe("DataList", { timeout: 60_000 }, () => {
  it("sets a value in mono, as a figure is, and a sentence written as a paragraph in sans", async () => {
    const list = page
      .locator('[data-slot="example"]')
      .filter({ has: page.locator('[data-slot="example-file"]', { hasText: /\/page-section\.tsx$/ }) })
      .locator("dl");
    const font = (selector: string) =>
      list
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).fontFamily.replace(/"/g, ""));
    // "vp check", a value with no paragraph, is a label; the first item's value is a sentence.
    expect(await font("dd:not(:has(p))")).toMatch(/^JetBrains Mono/);
    expect(await font("dd p")).toMatch(/^Geist Variable/);
  });
});
