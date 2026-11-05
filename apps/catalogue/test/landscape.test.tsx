// A phone held sideways is wider than the sidebar's mobile breakpoint but too short for an open sidebar.
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;

beforeAll(async () => {
  catalogue = await openCatalogue("overview", { viewport: { width: 844, height: 390 }, hasTouch: true });
}, 60_000);

afterAll(async () => catalogue?.close());

describe("phone in landscape", () => {
  it("starts the sidebar as the icon rail so the page has the screen", async () => {
    const sidebar = catalogue.page.locator('[data-slot="sidebar"][data-state]').first();
    expect(await sidebar.getAttribute("data-state")).toBe("collapsed");
  });
});
