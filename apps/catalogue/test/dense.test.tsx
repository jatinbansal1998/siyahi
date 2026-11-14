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

/** Goes to a family's route and waits for its page, by its title, so no locator reads the page it left. */
const open = async (route: string, title: string): Promise<Locator> => {
  await page.goto(page.url().replace(/#.*/, `#/${route}`));
  await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
  const preview = page.locator('[data-slot="example-preview"]').first();
  await preview.waitFor();
  return preview;
};

describe("dense tables, fields, focus and sidebar", { timeout: 60_000 }, () => {
  it("draws a table dense: 13px text, 24px heads, cells 2px by 6px", async () => {
    const table = await open("components/table", "Table");
    expect(await style(table.locator('[data-slot="table-head"]').first(), "height")).toEqual(["24px"]);
    const cell = table.locator('[data-slot="table-cell"]').first();
    expect(await style(cell, "padding-top", "padding-left", "font-size")).toEqual(["2px", "6px", "13px"]);
  });

  it("washes an invalid field red", async () => {
    const form = await open("inputs/field", "Field");
    const card = await themeColor(page, "--card");
    const [plain] = await style(form.getByLabel("Name"), "background-color");
    const [invalid, edge] = await style(form.getByLabel("Folio number"), "background-color", "border-top-color");
    expect(invalid).not.toBe(plain);
    expect(invalid).not.toBe(card);
    expect(edge).toBe(await themeColor(page, "--destructive"));
  });

  it("focuses a field as its own edge, 2px in the text colour, drawn inside it", async () => {
    const form = await open("inputs/field", "Field");
    const name = form.getByLabel("Name");
    await name.focus();
    const ink = await themeColor(page, "--foreground");
    expect(await themeColor(page, "--ring")).toBe(ink);
    await expect.poll(async () => (await style(name, "border-top-color"))[0]).toBe(ink);
    await expect.poll(async () => (await style(name, "box-shadow"))[0]).toBe(`${ink} 0px 0px 0px 1px inset`);
    expect(await style(name, "outline-style")).toEqual(["none"]);
  });

  it("focuses a pressed toggle with a text-colour ring and a page-colour ring inside it", async () => {
    const form = await open("inputs/field", "Field");
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
    const ink = await themeColor(page, "--foreground");
    const paper = await themeColor(page, "--background");
    await expect
      .poll(async () => (await style(pressed, "box-shadow"))[0])
      .toBe(`${ink} 0px 0px 0px 2px inset, ${paper} 0px 0px 0px 4px inset`);
    expect(await style(pressed, "outline-style")).toEqual(["none"]);
  });

  it("keeps a focused toggle's ring inside it, so a pressed neighbour cannot swallow it", async () => {
    await open("inputs/toggle-group", "Toggle group");
    const group = page.locator('[data-slot="example-preview"]').first().locator('[data-slot="toggle-group"]').first();
    await group.waitFor();
    // Focus "All" by keyboard, so :focus-visible applies: arrow onto the pressed "1Y" beside it and back.
    await group.getByRole("button", { name: "All" }).focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    const focused = group.locator('[data-slot="toggle-group-item"]:focus-visible');
    await expect.poll(() => focused.count()).toBe(1);
    expect(
      await focused.evaluate((el) => [
        el.textContent,
        el.getAttribute("aria-pressed"),
        el.previousElementSibling?.textContent,
        el.previousElementSibling?.getAttribute("aria-pressed"),
      ]),
    ).toEqual(["All", "false", "1Y", "true"]);
    const [outline, shadow = ""] = await style(focused, "outline-style", "box-shadow");
    expect(outline).toBe("none");
    expect(shadow.split(/,(?![^(]*\))/).every((layer) => layer.trim().endsWith("inset"))).toBe(true);
  });

  it("rings the whole command search, its icon included, when its input has focus", async () => {
    await open("inputs/command", "Command");
    const input = page.locator('[data-slot="command-input"]').first();
    await input.focus();
    const ink = await themeColor(page, "--foreground");
    const group = page.locator('[data-slot="input-group"]', { has: input });
    await expect.poll(async () => (await style(group, "border-top-color"))[0]).toBe(ink);
    expect(await style(input, "outline-style", "box-shadow")).toEqual(["none", "none"]);
  });

  it("draws a focused treemap tile's ring as a dashed stroke inside it, apart from a picked tile's solid one", async () => {
    await open("data/treemap", "Treemap");
    const tile = page.locator('[data-slot="treemap-tile"][tabindex="0"]').first();
    await tile.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    const rect = page.locator('[data-slot="treemap-tile"]:focus-visible > rect').first();
    await expect.poll(async () => (await style(rect, "stroke-dasharray"))[0]).toBe("3px, 2px");
    expect(await style(rect, "stroke")).toEqual([await themeColor(page, "--ring")]);
  });

  it("parts a non-collapsible sidebar from the page with a hairline, and keeps its rows compact", async () => {
    await open("components/table", "Table");
    // A collapsible sidebar is edged by shadcn; a non-collapsible one, in the page's flow, by the theme.
    const edge = await page.evaluate(() => {
      const sidebar = document.body.appendChild(document.createElement("div"));
      sidebar.dataset.slot = "sidebar";
      const width = getComputedStyle(sidebar).borderRightWidth;
      sidebar.remove();
      return width;
    });
    expect(edge).toBe("1px");
    // A row that opens a group: it renders as the group's collapsible trigger.
    const row = page.locator('[data-sidebar="menu-button"]:not([data-size="lg"])', { hasText: "Foundations" });
    expect(await style(row, "height")).toEqual(["28px"]);
  });
});
