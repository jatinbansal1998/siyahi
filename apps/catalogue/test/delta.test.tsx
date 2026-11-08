import { describe, expect, it, onTestFinished } from "vite-plus/test";
import { openCatalogue } from "./catalogue";

describe("Delta and trigger buttons", { timeout: 60_000 }, () => {
  it("sits on the text's baseline, so a sentence or a table row keeps its height", async () => {
    const { page, close } = await openCatalogue("data/delta");
    onTestFinished(close);
    const sentence = page.locator('[data-slot="example-preview"] p').filter({ hasText: "Revenue was" });
    const { height, lineHeight } = await sentence.evaluate((p) => ({
      height: p.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(getComputedStyle(p).lineHeight),
    }));
    expect(height).toBe(lineHeight);
  });

  it("keeps a button's faint edge when a popover trigger renders it, in dark", async () => {
    const { page, close } = await openCatalogue("inputs/popover", { colorScheme: "dark" });
    onTestFinished(close);
    const trigger = page.locator('[data-slot="example-preview"] [data-slot="popover-trigger"]').first();
    const edge = await trigger.evaluate((el) => {
      const probe = document.createElement("div");
      probe.style.borderColor = "var(--border)";
      el.parentElement?.append(probe);
      const faint = getComputedStyle(probe).borderTopColor;
      probe.remove();
      return { drawn: getComputedStyle(el).borderTopColor, faint };
    });
    expect(edge.drawn).toBe(edge.faint);
  });
});
