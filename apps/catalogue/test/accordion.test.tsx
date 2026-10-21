// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";
import AccordionExample from "../src/examples/accordion";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

const expanded = (triggers: HTMLButtonElement[]) => triggers.map((t) => t.getAttribute("aria-expanded"));

describe("Accordion example", () => {
  it("closes the open item when another opens in single mode", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<AccordionExample />));
    const single = document.querySelector('[aria-label="One open at a time"]');
    const triggers = [...(single?.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]') ?? [])];
    expect(expanded(triggers)).toEqual(["true", "false", "false"]);
    await act(async () => triggers[1]?.click());
    expect(expanded(triggers)).toEqual(["false", "true", "false"]);
  });
});
