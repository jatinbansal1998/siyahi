import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { Callout } from "../src/components/siyahi/callout";
import { WarningAlert } from "../src/components/siyahi/warning-alert";

/** The class list of the outermost element. */
const outer = (html: string): string => /^<\w+[^>]*class="([^"]+)"/.exec(html)?.[1] ?? "";

// The owner's rule: emphasis tints the whole box; a coloured stripe down one side is never the marker.
const SIDE_EDGE = /(^|\s)border-(l|r|s|e|x)(-|\s|$)/;

describe("Callout and WarningAlert", () => {
  it("tint the whole box in their tone, inside a full border, never a stripe down one side", () => {
    for (const tone of ["accent", "warning", "positive", "negative"] as const) {
      const classes = outer(renderToStaticMarkup(<Callout tone={tone}>Note</Callout>));
      const token = tone === "accent" ? "chart-1" : tone;
      expect(classes, tone).toMatch(new RegExp(`(^|\\s)bg-${token}/\\d+`));
      expect(classes, tone).toMatch(new RegExp(`(^|\\s)border-${token}/\\d+`));
      expect(classes, tone).toMatch(/(^|\s)border(\s|$)/);
      expect(classes, tone).not.toMatch(SIDE_EDGE);
    }
    const warning = outer(renderToStaticMarkup(<WarningAlert>Note</WarningAlert>));
    expect(warning).toMatch(/(^|\s)bg-warning\/\d+/);
    expect(warning).not.toMatch(SIDE_EDGE);
  });
});
