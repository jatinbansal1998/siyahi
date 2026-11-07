import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { SlopeChart, spread } from "../src/components/siyahi/slope-chart";

describe("spread", () => {
  it("leaves labels that do not touch where they are", () => {
    expect(spread([10, 40, 90], 18, 0, 100)).toEqual([10, 40, 90]);
  });

  it("pushes touching labels down a gap apart in order of height, and returns them in the items' order", () => {
    // 45 stays, 48 moves to 63, 50 to 81.
    expect(spread([50, 45, 48], 18, 0, 200)).toEqual([81, 45, 63]);
  });

  it("pulls the stack back up when the last label would run past the bottom", () => {
    expect(spread([90, 95, 100], 18, 0, 100)).toEqual([64, 82, 100]);
  });
});

describe("SlopeChart", () => {
  it("says every item's two values in words, for a screen reader", () => {
    const html = renderToStaticMarkup(
      <SlopeChart items={[{ name: "Online", from: 0.18, to: 0.27 }]} fromLabel="2025" toLabel="2026" />,
    );
    expect(html).toContain("<li>Online: 2025 18.0%, 2026 27.0%</li>");
  });
});
