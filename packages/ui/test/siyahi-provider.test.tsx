import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { PanelGrid } from "../src/components/siyahi/panel-grid";
import { SiyahiProvider, useLocale } from "../src/components/siyahi/siyahi-provider";

/** The locale a provider hands down, as text. */
function Shown() {
  const { numberLocale, currency, timeZone } = useLocale();
  return `${numberLocale} ${currency} ${timeZone}`;
}

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

  it("keeps the default for a setting the page passes as undefined", () => {
    const html = renderToStaticMarkup(
      <SiyahiProvider locale={{ numberLocale: "en-US", currency: undefined, timeZone: undefined }}>
        <Shown />
      </SiyahiProvider>,
    );
    expect(html).toBe("en-US INR Asia/Kolkata");
  });

  it("keeps the surface around it when it only changes the locale", () => {
    const html = renderToStaticMarkup(
      <SiyahiProvider surface="card">
        <SiyahiProvider locale={{ numberLocale: "en-US" }}>
          <PanelGrid>
            <p>Block</p>
          </PanelGrid>
        </SiyahiProvider>
      </SiyahiProvider>,
    );
    // Card sets its boxes 8px apart; the open default would part them with wider space.
    expect(html).toContain('data-surface="card"');
    expect(html).toContain("gap-2");
  });

  it("lays a page that sets no surface out open, with or without a provider", () => {
    const grid = (
      <PanelGrid>
        <p>Block</p>
      </PanelGrid>
    );
    for (const html of [renderToStaticMarkup(grid), renderToStaticMarkup(<SiyahiProvider>{grid}</SiyahiProvider>)]) {
      expect(html).toContain('data-surface="open"');
      expect(html).toContain("gap-x-6 gap-y-4");
    }
  });
});
