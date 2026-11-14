import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { SiyahiProvider, useLocale } from "../src/components/siyahi/siyahi-provider";

/** The locale a provider hands down, as text. */
function Shown() {
  const { numberLocale, currency, timeZone } = useLocale();
  return `${numberLocale} ${currency} ${timeZone}`;
}

describe("SiyahiProvider", () => {
  it("draws no element of its own, so it can sit inside a table body", () => {
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
});
