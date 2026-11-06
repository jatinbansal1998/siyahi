import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { TargetRows, type TargetRow } from "../src/components/siyahi/target-rows";

const style = (html: string, slot: string) =>
  [...html.matchAll(new RegExp(`data-slot="${slot}"[^>]*style="([^"]+)"`, "g"))].map((m) => m[1]);

describe("TargetRows", () => {
  it("places the value bar, the target tick and the bands on the shared domain", () => {
    const html = renderToStaticMarkup(
      <TargetRows domain={[0, 50]} rows={[{ label: "Debt", value: 20, target: 25, bands: [[20, 30]] }]} />,
    );
    expect(style(html, "target-value")).toEqual(["width:40.00%"]);
    expect(style(html, "target-tick")).toEqual(["left:50.00%"]);
    expect(style(html, "target-band")[0]).toMatch(/^left:40.00%;right:calc\(100% - 60.00%\)/);
  });

  it("marks a met target ✓, a miss — and only a warning in amber", () => {
    const rows: TargetRow[] = (["met", "missed", "warning"] as const).map((kind) => ({
      label: kind,
      value: 1,
      target: 1,
      status: { kind, label: kind },
    }));
    const html = renderToStaticMarkup(<TargetRows rows={rows} />);
    const glyphs = [...html.matchAll(/data-kind="(\w+)"[^>]*><span aria-hidden="true" class="([^"]+)">(.)</g)];
    expect(glyphs.map(([, kind, , glyph]) => [kind, glyph])).toEqual([
      ["met", "✓"],
      ["missed", "—"],
      ["warning", "⚠"],
    ]);
    expect(glyphs.filter(([, , classes]) => classes?.includes("text-warning")).map(([, kind]) => kind)).toEqual([
      "warning",
    ]);
  });
});
