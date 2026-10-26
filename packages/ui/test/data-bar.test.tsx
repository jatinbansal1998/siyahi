import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { DataBar } from "../src/components/siyahi/data-bar";

/** The bar's width and classes, read from the markup. */
function bar(html: string): { width: string | undefined; fill: string | undefined } {
  const match = /<div class="h-full rounded-full ([^"]+)" style="width:([^"]+)"/.exec(html);
  return { fill: match?.[1], width: match?.[2] };
}

describe("DataBar", () => {
  it("draws the figure's share of max, and never past a full bar", () => {
    expect(
      bar(
        renderToStaticMarkup(
          <DataBar value={25} max={100}>
            25
          </DataBar>,
        ),
      ).width,
    ).toBe("25%");
    expect(
      bar(
        renderToStaticMarkup(
          <DataBar value={150} max={100}>
            150
          </DataBar>,
        ),
      ).width,
    ).toBe("100%");
    expect(
      bar(
        renderToStaticMarkup(
          <DataBar value={0} max={0}>
            0
          </DataBar>,
        ),
      ).width,
    ).toBe("0%");
  });

  it("draws a loss's size in --negative and a gain's in --positive with tone sign", () => {
    const loss = bar(
      renderToStaticMarkup(
        <DataBar value={-40} max={80} tone="sign">
          -40
        </DataBar>,
      ),
    );
    expect(loss).toEqual({ fill: "bg-negative", width: "50%" });
    expect(
      bar(
        renderToStaticMarkup(
          <DataBar value={40} max={80} tone="sign">
            40
          </DataBar>,
        ),
      ).fill,
    ).toBe("bg-positive");
    expect(
      bar(
        renderToStaticMarkup(
          <DataBar value={-40} max={80}>
            -40
          </DataBar>,
        ),
      ).fill,
    ).toBe("bg-chart-1");
  });
});
