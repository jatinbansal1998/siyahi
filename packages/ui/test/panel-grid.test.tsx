import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { PanelGrid } from "../src/components/siyahi/panel-grid";

const blocks = (n: number) => Array.from({ length: n }, (_, i) => <p key={i}>Block {i + 1}</p>);

describe("PanelGrid on a large monitor", () => {
  it("takes a third and a fourth block across when it holds that many", () => {
    const html = renderToStaticMarkup(<PanelGrid>{blocks(4)}</PanelGrid>);
    expect(html).toContain("@min-[140rem]/panels:grid-cols-3");
    expect(html).toContain("@min-[180rem]/panels:grid-cols-4");
  });

  it("leaves a pair two across, so no column stands empty beside it", () => {
    const html = renderToStaticMarkup(
      <PanelGrid>
        {blocks(2)}
        {false}
      </PanelGrid>,
    );
    expect(html).not.toContain("@min-[140rem]");
    expect(html).not.toContain("@min-[180rem]");
  });

  it("keeps a one-column grid one across", () => {
    expect(renderToStaticMarkup(<PanelGrid columns={1}>{blocks(4)}</PanelGrid>)).not.toContain("@min-[");
  });
});
