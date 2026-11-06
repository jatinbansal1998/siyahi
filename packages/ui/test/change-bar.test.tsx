import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { ChangeBar } from "../src/components/siyahi/change-bar";

/** The fill's inline style, read from the markup. */
function fill(html: string): string | undefined {
  return /data-slot="change-bar-fill"[^>]*style="([^"]+)"/.exec(html)?.[1];
}

describe("ChangeBar", () => {
  it("draws each change's size against the column's largest, from the left", () => {
    expect(fill(renderToStaticMarkup(<ChangeBar value={0.03} max={0.12} />))).toBe("left:0;width:25%");
    expect(fill(renderToStaticMarkup(<ChangeBar value={-0.12} max={0.12} />))).toBe("left:0;width:100%");
  });

  it("grows a loss leftward and a gain rightward from the centre when diverging", () => {
    expect(fill(renderToStaticMarkup(<ChangeBar value={-0.06} max={0.12} diverging />))).toBe("right:50%;width:25%");
    expect(fill(renderToStaticMarkup(<ChangeBar value={0.12} max={0.12} diverging />))).toBe("left:50%;width:50%");
  });
});
