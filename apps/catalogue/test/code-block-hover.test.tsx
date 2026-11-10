// A copy button's hover fill on a laptop, where hover applies (a touch screen has none), in Chromium.
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;

beforeAll(async () => {
  catalogue = await openCatalogue("overview", { viewport: { width: 1366, height: 900 } });
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

it(
  "gives a copy button written straight in a block the header button's hover fill, light and dark",
  { timeout: 30_000 },
  async () => {
    const { page } = catalogue;
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.reload();
      const blocks = page.locator('main [data-slot="code-block"]');
      await blocks.nth(1).waitFor();
      // The fill eases in; this reads where it settles, not the animation.
      await page.addStyleTag({ content: "* { transition: none !important; }" });
      // As a page may write it: CodeBlockActions straight in the block, which core floats on its own fill.
      await blocks.first().evaluate((el) => {
        const header = el.querySelector(':scope > [data-slot="code-block-header"]');
        const actions = header?.querySelector('[data-slot="code-block-actions"]');
        if (actions) el.prepend(actions);
        header?.remove();
      });
      const fill = (button: ReturnType<typeof page.locator>) =>
        button.evaluate((el) => getComputedStyle(el).backgroundColor);
      const header = blocks.nth(1).locator('[data-slot="code-block-copy-button"]');
      const moved = blocks.first().locator('> [data-slot="code-block-actions"] button');
      expect(await fill(moved)).toBe("rgba(0, 0, 0, 0)");
      await header.hover();
      const hovered = await fill(header);
      expect(hovered).not.toBe("rgba(0, 0, 0, 0)");
      await moved.hover();
      expect(await fill(moved)).toBe(hovered);
      await page.mouse.move(0, 0);
    }
  },
);
