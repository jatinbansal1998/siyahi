// A copy button's hover fill on a laptop, where hover applies (a touch screen has none), in Chromium.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;
let header: Locator;
let moved: Locator;

// The page is loaded once: the scheme follows prefers-color-scheme in CSS alone, so switching it needs no reload.
beforeAll(async () => {
  catalogue = await openCatalogue("components/code-block", { viewport: { width: 1366, height: 900 } });
  page = catalogue.page;
  const blocks = page.locator('main [data-slot="code-block"]');
  await blocks.nth(1).waitFor();
  // The fill eases in; this reads where it settles, not the animation.
  await page.addStyleTag({ content: "* { transition: none !important; }" });
  // As a page may write it: CodeBlockActions straight in the block, which core floats on its own fill.
  await blocks.first().evaluate((el) => {
    const blockHeader = el.querySelector(':scope > [data-slot="code-block-header"]');
    const actions = blockHeader?.querySelector('[data-slot="code-block-actions"]');
    if (actions) el.prepend(actions);
    blockHeader?.remove();
  });
  header = blocks.nth(1).locator('[data-slot="code-block-copy-button"]');
  moved = blocks.first().locator('> [data-slot="code-block-actions"] button');
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const fill = (button: Locator): Promise<string> => button.evaluate((el) => getComputedStyle(el).backgroundColor);

for (const colorScheme of ["light", "dark"] as const) {
  it(`gives a copy button written straight in a block the header button's hover fill, ${colorScheme}`, async () => {
    await page.emulateMedia({ colorScheme });
    await page.mouse.move(0, 0);
    expect(await fill(moved)).toBe("rgba(0, 0, 0, 0)");
    await header.hover();
    const hovered = await fill(header);
    expect(hovered).not.toBe("rgba(0, 0, 0, 0)");
    await moved.hover();
    expect(await fill(moved)).toBe(hovered);
  });
}
