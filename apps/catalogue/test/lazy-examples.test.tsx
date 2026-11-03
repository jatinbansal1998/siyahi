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
  const section = page.locator("#button");
  await section.locator('[data-slot="example-preview"]').waitFor();
  expect(await page.locator("main > section").count()).toBe(1);
  expect(fetched).toEqual([]);
  await section.getByRole("button", { name: "Show source", exact: true }).click();
  await section.locator("pre").waitFor();
  expect((await section.locator("pre").innerText()).includes('from "@siyahi/ui"')).toBe(true);
  expect(fetched.some((url) => url.includes("button.tsx"))).toBe(true);
  await page.getByRole("link", { name: "All Components examples", exact: true }).click();
  await page.locator("main > section").nth(1).waitFor();
  expect(await page.locator("main > section").count()).toBeGreaterThan(1);
}, 30_000);
