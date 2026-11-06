import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
beforeAll(async () => {
  catalogue = await openCatalogue("overview");
}, 60_000);
afterAll(async () => catalogue?.close());

it("loads example source only when requested and keeps it copyable", async () => {
  const { page } = catalogue;
  const sources = () =>
    page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => url.includes("/examples/") && url.includes("raw")),
    );
  expect(await sources()).toEqual([]);
  const fetched: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/examples/") && request.url().includes("raw")) fetched.push(request.url());
  });
  await page.evaluate(() => {
    location.hash = "#/components/button";
  });
  // The family's first example: the Button page also shows its states below it.
  const example = page.locator("#button").locator('[data-slot="example"]').first();
  await example.locator('[data-slot="example-preview"]').waitFor();
  expect(await page.locator("main > section").count()).toBe(1);
  expect(fetched).toEqual([]);
  await example.getByRole("button", { name: "Show source", exact: true }).click();
  await example.locator("pre").waitFor();
  expect((await example.locator("pre").innerText()).includes('from "@siyahi/ui"')).toBe(true);
  expect(fetched.some((url) => url.includes("button.tsx"))).toBe(true);
  // Back up to the category, which lists the families and loads none of their examples.
  await page.getByRole("navigation", { name: "breadcrumb" }).getByRole("link", { name: "Components" }).click();
  await page.getByRole("heading", { level: 1, name: "Components" }).waitFor();
  expect(await page.locator('[data-slot="example"]').count()).toBe(0);
}, 30_000);
