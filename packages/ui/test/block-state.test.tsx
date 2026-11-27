import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { BlockState } from "../src/components/siyahi/block-state";

/** The class list of the outermost element. */
const outer = (html: string): string => /^<\w+[^>]*class="([^"]+)"/.exec(html)?.[1] ?? "";

describe("BlockState", () => {
  it("washes an error's whole box red inside a solid red border and reads it out as an alert", () => {
    const html = renderToStaticMarkup(<BlockState tone="negative" title="Returns failed to load" />);
    const classes = outer(html);
    expect(classes).toMatch(/(^|\s)bg-negative\/\d+/);
    expect(classes).toMatch(/(^|\s)border-negative\/\d+/);
    expect(classes).toMatch(/(^|\s)border-solid(\s|$)/);
    expect(html).toMatch(/^<\w+[^>]*role="alert"/);
  });

  it("leaves an empty block unwashed and silent, since having nothing to show is not an error", () => {
    const html = renderToStaticMarkup(<BlockState title="No refund today" />);
    expect(outer(html)).not.toMatch(/(^|\s)(bg|border)-negative/);
    expect(html).not.toContain('role="alert"');
  });
});
