// @vitest-environment happy-dom
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@siyahi/ui";
import type { DetachedWindowAPI } from "happy-dom";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import AppSidebarExample from "../src/examples/app-sidebar";

declare global {
  // happy-dom's control API, present under the happy-dom environment.
  interface Window {
    happyDOM: DetachedWindowAPI;
  }
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

async function render(ui: ReactNode): Promise<void> {
  const root = createRoot(document.body.appendChild(document.createElement("div")));
  roots.push(root);
  await act(async () => root.render(ui));
}

async function click(selector: string): Promise<void> {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`nothing matches ${selector}`);
  await act(async () => element.click());
}

/** Renders AppSidebar with a trigger, as an app shell does. */
const shell = (navMain: Parameters<typeof AppSidebar>[0]["navMain"]) => (
  <SidebarProvider>
    <SidebarTrigger />
    <AppSidebar navMain={navMain} />
  </SidebarProvider>
);

const drawerOpen = () => document.querySelector('[data-slot="sidebar"][data-mobile="true"]')?.hasAttribute("data-open");

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  window.happyDOM.setViewport({ width: 1024, height: 768 });
});

describe("AppSidebar with flat items", () => {
  it("renders an item without sub-items as a link to its view", async () => {
    await render(<AppSidebarExample />);
    expect(document.querySelector('a[href="#/data"]')?.getAttribute("data-slot")).toBe("sidebar-menu-button");
  });

  it("marks the active item and no other, for eyes and screen readers", async () => {
    await render(<AppSidebarExample />);
    const active = document.querySelector('a[href="#/blocks"]');
    const other = document.querySelector('a[href="#/data"]');
    expect(active?.hasAttribute("data-active")).toBe(true);
    expect(active?.getAttribute("aria-current")).toBe("page");
    expect(other?.hasAttribute("data-active")).toBe(false);
    expect(other?.hasAttribute("aria-current")).toBe(false);
  });

  it("spreads an item's linkProps onto its anchor, handlers included", async () => {
    const prefetch = vi.fn();
    await render(shell([{ title: "Data", url: "#/data", linkProps: { target: "_blank", onMouseEnter: prefetch } }]));
    const anchor = document.querySelector('a[href="#/data"]');
    expect(anchor?.getAttribute("target")).toBe("_blank");
    await act(async () => anchor?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(prefetch).toHaveBeenCalledOnce();
  });

  it("closes the phone drawer when a flat link is followed", async () => {
    window.happyDOM.setViewport({ width: 390, height: 844 });
    await render(shell([{ title: "Data", url: "#/data" }]));
    await click('[data-sidebar="trigger"]');
    expect(drawerOpen()).toBe(true);
    await click('[data-mobile="true"] a[href="#/data"]');
    expect(drawerOpen()).not.toBe(true);
  });

  it("closes the phone drawer when a sub-item link is followed", async () => {
    window.happyDOM.setViewport({ width: 390, height: 844 });
    await render(
      shell([{ title: "Data", url: "#/data", isActive: true, items: [{ title: "Charts", url: "#/data/charts" }] }]),
    );
    await click('[data-sidebar="trigger"]');
    expect(drawerOpen()).toBe(true);
    await click('[data-mobile="true"] a[href="#/data/charts"]');
    expect(drawerOpen()).not.toBe(true);
  });
});
