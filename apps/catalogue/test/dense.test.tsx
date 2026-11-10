// Reads dense tables, form fields, focus and the sidebar in Chromium: they come from the theme's CSS, which happy-dom
// does not apply.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("components/table");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const style = (locator: Locator, ...names: string[]): Promise<string[]> =>
  locator.evaluate((el, props) => props.map((prop) => getComputedStyle(el).getPropertyValue(prop)), names);

const open = async (route: string): Promise<Locator> => {
  await page.goto(page.url().replace(/#.*/, `#/${route}`));
  const preview = page.locator('[data-slot="example-preview"]').first();
  await preview.waitFor();
  return preview;
};

describe("dense tables, fields, focus and sidebar", { timeout: 60_000 }, () => {
  it("draws a table dense: compact rows, a text-colour rule under the heads, a medium first column, mono figures", async () => {
    const table = await open("components/table");
    expect(await style(table.locator('[data-slot="table-head"]').first(), "height")).toEqual(["28px"]);
    expect(await style(table.locator('[data-slot="table-cell"]').first(), "padding-top")).toEqual(["3.2px"]);
    expect(
      await style(table.locator('[data-slot="table-header"] [data-slot="table-row"]'), "border-bottom-color"),
    ).toEqual([await themeColor(page, "--foreground")]);
    const firstRow = table.locator('[data-slot="table-body"] [data-slot="table-row"]').first();
    expect(await style(firstRow.locator('[data-slot="table-cell"]').first(), "font-weight")).toEqual(["500"]);
    const [font, size] = await style(firstRow.locator('[data-slot="table-cell"]').nth(1), "font-family", "font-size");
    expect([font?.startsWith('"Geist Mono'), size]).toEqual([true, "13px"]);
  });

  it("sets a field's label above it in small muted mono capitals, and washes an invalid field red", async () => {
    const form = await open("inputs/field");
    const label = form.locator('[data-slot="field-label"]', { hasText: "Name" });
    const [font, transform, size, color] = await style(label, "font-family", "text-transform", "font-size", "color");
    expect([font?.startsWith('"Geist Mono'), transform, size, color]).toEqual([
      true,
      "uppercase",
      "11px",
      await themeColor(page, "--muted-foreground"),
    ]);
    const card = await themeColor(page, "--card");
    const [plain] = await style(form.getByLabel("Name"), "background-color");
    const [invalid, edge] = await style(form.getByLabel("Folio number"), "background-color", "border-top-color");
    expect(invalid).not.toBe(plain);
    expect(invalid).not.toBe(card);
    expect(edge).toBe(await themeColor(page, "--destructive"));
  });

  it("focuses a field as its own 2px edge in the text colour, with no indigo", async () => {
    const form = await open("inputs/field");
    const name = form.getByLabel("Name");
    await name.focus();
    const ink = await themeColor(page, "--foreground");
    // The field eases its edge and shadow in; read them once the transition has ended.
    await expect.poll(async () => (await style(name, "border-top-color"))[0]).toBe(ink);
    await expect.poll(async () => (await style(name, "box-shadow"))[0]).toContain("1px");
    const [shadow = ""] = await style(name, "box-shadow");
    // One 1px ring of the text colour outside the 1px border; every other ring layer is empty.
    const layers = shadow.split(/,(?![^(]*\))/).map((layer) => layer.trim());
    expect(layers.filter((layer) => !layer.endsWith("0px 0px 0px 0px"))).toEqual([`${ink} 0px 0px 0px 1px`]);
  });

  it("focuses a pressed toggle with a half-strength halo of the text colour around its black fill", async () => {
    const form = await open("inputs/field");
    // Keyboard focus, so :focus-visible applies: Tab from the field before the group, then arrow to the pressed item.
    await form.getByLabel("Folio number").focus();
    await page.keyboard.press("Tab");
    for (let step = 0; step < 3; step++) {
      if ((await page.evaluate(() => document.activeElement?.textContent)) === "Quarterly") break;
      await page.keyboard.press("ArrowRight");
    }
    const pressed = form.getByRole("button", { name: "Quarterly" });
    expect(await pressed.evaluate((el) => el === document.activeElement && el.getAttribute("aria-pressed"))).toBe(
      "true",
    );
    const halo = () =>
      pressed.evaluate((el) =>
        getComputedStyle(el)
          .boxShadow.split(/,(?![^(]*\))/)
          .map((layer) => layer.trim())
          .find((layer) => layer.endsWith("0px 0px 0px 3px")),
      );
    const expected = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement("div"));
      probe.style.color = "color-mix(in oklab, var(--ring) 50%, transparent)";
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    await expect.poll(halo).toBe(`${expected} 0px 0px 0px 3px`);
    expect(await themeColor(page, "--ring")).toBe(await themeColor(page, "--foreground"));
  });

  it("parts the sidebar from the page with a hairline, its group label in mono capitals and its rows compact", async () => {
    await open("components/table");
    const container = page.locator('[data-slot="sidebar-container"]');
    expect(await style(container, "border-right-width", "border-right-color")).toEqual([
      "1px",
      await themeColor(page, "--sidebar-border"),
    ]);
    const [font, transform] = await style(
      page.locator('[data-slot="sidebar-group-label"]').first(),
      "font-family",
      "text-transform",
    );
    expect([font?.startsWith('"Geist Mono'), transform]).toEqual([true, "uppercase"]);
    // A row, not the large header button, which keeps its height.
    // A row that opens a group: it renders as the group's collapsible trigger.
    const row = page.locator('[data-sidebar="menu-button"]:not([data-size="lg"])', { hasText: "Foundations" });
    expect(await style(row, "height")).toEqual(["28px"]);
  });
});
