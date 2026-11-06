import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { RangePosition } from "../src/components/siyahi/range-position";

const style = (html: string, slot: string) => new RegExp(`data-slot="${slot}"[^>]*style="([^"]+)"`).exec(html)?.[1];

describe("RangePosition", () => {
  it("fills to the value's share of the range and writes it as a percentage", () => {
    const html = renderToStaticMarkup(<RangePosition low={100} high={200} value={176} />);
    expect(style(html, "range-fill")).toBe("width:76.00%");
    expect(style(html, "range-thumb")).toBe("left:76.00%");
    expect(html).toContain(">76%</span>");
  });

  it("pins a value outside the range to the nearer end", () => {
    expect(style(renderToStaticMarkup(<RangePosition low={100} high={200} value={250} />), "range-thumb")).toBe(
      "left:100.00%",
    );
    expect(
      style(renderToStaticMarkup(<RangePosition variant="compact" low={100} high={200} value={40} />), "range-thumb"),
    ).toBe("left:0.00%");
  });

  it("keeps the value's label inside the track by shifting it by its own share", () => {
    expect(style(renderToStaticMarkup(<RangePosition low={0} high={10} value={9} />), "range-value")).toBe(
      "left:90.00%;transform:translateX(-90.00%)",
    );
  });
});
