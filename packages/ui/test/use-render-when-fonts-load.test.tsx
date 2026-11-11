// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { fontLoads, useRenderWhenFontsLoad } from "../src/lib/use-render-when-fonts-load";

// The page's font set as the browser has it once nothing is loading, with the event a finished load fires.
const fonts = Object.assign(new EventTarget(), { status: "loaded" });
Object.defineProperty(document, "fonts", { value: fonts, configurable: true });
const finishLoad = () => act(async () => void fonts.dispatchEvent(new Event("loadingdone")));

let renders = 0;
// What the probe's text measures: Geist's width once Geist has loaded, the fallback's before.
let width = 100;
function Probe() {
  useRenderWhenFontsLoad(() => width);
  renders++;
  return null;
}

const root = createRoot(document.body.appendChild(document.createElement("div")));
afterEach(() => act(async () => root.render(null)));

describe("useRenderWhenFontsLoad", () => {
  it("renders again when a load finishes after mount and changes the widths, though nothing was loading then (#83)", async () => {
    // A chart whose own text is the first to ask for Geist mounts while the set still reads "loaded".
    width = 100;
    await act(async () => root.render(<Probe />));
    const mounted = renders;
    width = 92;
    await finishLoad();
    expect(renders).toBe(mounted + 1);
    // A subset for other characters can load later still and change them again.
    width = 95;
    await finishLoad();
    expect(renders).toBe(mounted + 2);
  });

  it("leaves the chart alone when a load changes nothing it measures, so its marks do not fade in again", async () => {
    width = 100;
    await act(async () => root.render(<Probe />));
    const mounted = renders;
    await finishLoad();
    expect(renders).toBe(mounted);
  });

  it("counts finished loads, so a width measured before one is not kept after it", async () => {
    const before = fontLoads();
    await finishLoad();
    expect(fontLoads()).toBe(before + 1);
  });
});
