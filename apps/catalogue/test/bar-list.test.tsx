// @vitest-environment happy-dom
import { BarList, Delta } from "@siyahi/ui";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
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
    expect(detail?.textContent).toBe("▲up59.8%");
    expect(detail?.querySelector('[data-slot="delta"]')?.classList.contains("text-positive")).toBe(true);
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
    const widths = [...document.querySelectorAll<HTMLElement>('[data-slot="bar-list-row"] [aria-hidden="true"]')].map(
      (bar) => bar.style.width,
    );
    expect(widths).toEqual(["25%", "12.5%"]);
  });
});
