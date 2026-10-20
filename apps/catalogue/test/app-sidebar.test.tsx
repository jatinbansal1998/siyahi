import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import AppSidebarExample from "../src/examples/app-sidebar";

const html = renderToStaticMarkup(<AppSidebarExample />);
const anchorTo = (href: string) => new RegExp(`<a [^>]*href="${href}"[^>]*>`).exec(html)?.[0];

describe("AppSidebar with flat items", () => {
  it("renders an item without sub-items as a link to its view", () => {
    expect(anchorTo("#/data")).toContain('data-slot="sidebar-menu-button"');
  });

  it("marks the active item and no other", () => {
    expect(anchorTo("#/blocks")).toContain(' data-active=""');
    expect(anchorTo("#/data")).not.toContain(' data-active=""');
  });
});
