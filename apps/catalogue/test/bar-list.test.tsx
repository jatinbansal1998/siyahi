// @vitest-environment happy-dom
import { BarList, Delta } from "@siyahi/ui";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vite-plus/test";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

describe("BarList", () => {
  it("renders an item's detail after its label, outside the link", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <BarList data={[{ name: "TATAMOTORS", href: "#/tm", value: 65907, detail: <Delta value={0.598} /> }]} />,
      ),
    );
    const link = document.querySelector('a[href="#/tm"]');
    const detail = link?.nextElementSibling;
    expect(link?.textContent).toBe("TATAMOTORS");
    expect(detail?.getAttribute("data-slot")).toBe("bar-list-detail");
    expect(detail?.textContent).toBe("+59.8%");
    expect(detail?.querySelector('[data-slot="delta"] svg')?.classList.contains("text-positive")).toBe(true);
  });

  it("draws its bars against max when given one, so two lists can share a scale", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <BarList
          data={[
            { name: "ITC", value: 50 },
            { name: "TCS", value: 25 },
          ]}
          max={200}
        />,
      ),
    );
    const widths = [...document.querySelectorAll<HTMLElement>('[data-slot="bar-list-bar"]')].map(
      (bar) => bar.style.width,
    );
    expect(widths).toEqual(["25%", "12.5%"]);
  });

  it("draws a neutral bar on a row with a detail, so the Delta's colour is the row's only one", () => {
    // Server markup keeps the color-mix() that happy-dom's style parser drops.
    const html = renderToStaticMarkup(
      <BarList
        color="var(--negative)"
        data={[
          { name: "ITC", value: 50, detail: <Delta value={-0.06} /> },
          { name: "TCS", value: 25 },
        ]}
      />,
    );
    const fills = [...html.matchAll(/data-slot="bar-list-bar"[^>]*background-color:([^"]+)"/g)].map(([, fill]) => fill);
    expect(fills).toHaveLength(2);
    expect(fills[0]).toContain("var(--muted-foreground) 20%");
    expect(fills[1]).toContain("var(--negative)");
  });

  it("lays each label on a full-width track, so a short bar's end does not cut it", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<BarList data={[{ name: "WIPRO", value: 1 }]} max={100} />));
    const track = document.querySelector('[data-slot="bar-list-track"]');
    expect(track?.classList.contains("inset-0")).toBe(true);
    expect(track?.nextElementSibling?.getAttribute("data-slot")).toBe("bar-list-bar");
  });
});
