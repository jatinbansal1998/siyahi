// A code block's copy button in Chromium on a phone: where it sits against the code and what paints over what are
// layout and stacking, which only a real browser works out.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  // A phone: the section strip shows and sticks, and core draws a floating copy button for good on a touch screen.
  catalogue = await openCatalogue("overview", { viewport: { width: 390, height: 844 }, hasTouch: true });
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** Whether the copy button's box clears the code's: it sits wholly above the first line, not over it. */
const clearsCode = (block: Locator): Promise<boolean> =>
  block.evaluate((el) => {
    const button = el.querySelector('[data-slot="code-block-copy-button"]')?.getBoundingClientRect();
    const code = el.querySelector('[data-slot="code-block-code"]')?.getBoundingClientRect();
    return !!button && !!code && button.bottom <= code.top;
  });

it("puts every snippet's copy button in a header row above the code", async () => {
  const blocks = page.locator('main [data-slot="code-block"]');
  await blocks.first().waitFor();
  const count = await blocks.count();
  expect(count).toBeGreaterThan(1);
  for (let i = 0; i < count; i++) {
    const block = blocks.nth(i);
    expect(await block.locator('> [data-slot="code-block-header"] [data-slot="code-block-copy-button"]').count()).toBe(
      1,
    );
    expect(await clearsCode(block)).toBe(true);
  }
});

it("keeps a copy button written straight in the block under the sticky section strip", async () => {
  // Core's markup allows CodeBlockActions straight in the block, which core floats over the code; a page may write it.
  const block = page.locator('main [data-slot="code-block"]').first();
  await block.evaluate((el) => {
    const header = el.querySelector(':scope > [data-slot="code-block-header"]');
    const actions = header?.querySelector('[data-slot="code-block-actions"]');
    if (actions) el.prepend(actions);
    header?.remove();
  });
  const actions = block.locator('> [data-slot="code-block-actions"]');
  // Scrolled under the stuck strip, whatever paints at the button's middle belongs to the strip.
  await actions.evaluate((el) => {
    const toc = document.querySelector('[data-slot="page-toc"]') as Element;
    const button = el.getBoundingClientRect();
    scrollTo({
      top: scrollY + button.top + button.height / 2 - 56 - toc.getBoundingClientRect().height / 2,
      behavior: "instant",
    });
  });
  const strip = await page.locator('[data-slot="page-toc"]').boundingBox();
  const box = await actions.boundingBox();
  expect(strip && box && Math.abs(strip.y + strip.height / 2 - (box.y + box.height / 2))).toBeLessThan(4);
  const middle = { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 };
  const onTop = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    return hit?.closest('[data-slot="page-toc"]')
      ? "page-toc"
      : (hit?.closest("[data-slot]")?.getAttribute("data-slot") ?? "none");
  }, middle);
  expect(onTop).toBe("page-toc");
});
