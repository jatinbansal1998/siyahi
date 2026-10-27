import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { PanelGrid } from "../src/components/siyahi/panel-grid";
import { SiyahiProvider } from "../src/components/siyahi/siyahi-provider";

describe("SiyahiProvider", () => {
  it("draws no element of its own when it sets no surface, so it can sit inside a table body", () => {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <SiyahiProvider locale={{ numberLocale: "en-US" }}>
            <tr>
              <td>1,000</td>
            </tr>
          </SiyahiProvider>
        </tbody>
      </table>,
    );
    expect(html).toBe("<table><tbody><tr><td>1,000</td></tr></tbody></table>");
  });

  it("keeps the surface around it when it only changes the locale", () => {
    const html = renderToStaticMarkup(
      <SiyahiProvider surface="open">
        <SiyahiProvider locale={{ numberLocale: "en-US" }}>
          <PanelGrid>
            <p>Block</p>
          </PanelGrid>
        </SiyahiProvider>
      </SiyahiProvider>,
    );
    // Open parts blocks with whitespace; a ruled grid would rule each panel's edges.
    expect(html).toContain("gap-x-8");
    expect(html).not.toContain("border-l");
  });
});
