// @vitest-environment happy-dom
import { CopyButton } from "@siyahi/ui";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("CopyButton", () => {
  it("copies its value, then reads Copied for 2 s before its label returns", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<CopyButton value="pnpm install" label="Copy all" />));
    const button = document.querySelector("button");
    expect(button?.textContent).toBe("Copy all");
    await act(async () => button?.click());
    expect(writeText).toHaveBeenCalledWith("pnpm install");
    expect(button?.textContent).toBe("Copied");
    await act(async () => vi.advanceTimersByTime(1900));
    expect(button?.textContent).toBe("Copied");
    await act(async () => vi.advanceTimersByTime(100));
    expect(button?.textContent).toBe("Copy all");
  });
});
