import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { Callout } from "../src/components/siyahi/callout";
import { StatusAlert } from "../src/components/siyahi/status-alert";
import { StatusBadge } from "../src/components/siyahi/status-badge";

/** The class list of the outermost element. */
const outer = (html: string): string => /^<\w+[^>]*class="([^"]+)"/.exec(html)?.[1] ?? "";

// The owner's rule: emphasis tints the whole box; a coloured stripe down one side is never the marker.
const SIDE_EDGE = /(^|\s)border-(l|r|s|e|x)(-|\s|$)/;

describe("Callout, StatusAlert and StatusBadge", () => {
  it("tint the whole box in their tone, inside a full border, never a stripe down one side", () => {
    for (const tone of ["accent", "warning", "positive", "negative"] as const) {
      const classes = outer(renderToStaticMarkup(<Callout tone={tone}>Note</Callout>));
      const token = tone === "accent" ? "link" : tone;
      expect(classes, tone).toMatch(new RegExp(`(^|\\s)bg-${token}/\\d+`));
      expect(classes, tone).toMatch(new RegExp(`(^|\\s)border-${token}/\\d+`));
      expect(classes, tone).toMatch(/(^|\s)border(\s|$)/);
      expect(classes, tone).not.toMatch(SIDE_EDGE);
    }
    for (const tone of ["warning", "negative", "positive"] as const) {
      for (const html of [
        renderToStaticMarkup(<StatusAlert tone={tone}>Note</StatusAlert>),
        renderToStaticMarkup(<StatusBadge tone={tone}>Note</StatusBadge>),
      ]) {
        const classes = outer(html);
        expect(classes, tone).toMatch(new RegExp(`(^|\\s)bg-${tone}/\\d+`));
        expect(classes, tone).toMatch(new RegExp(`(^|\\s)border-${tone}/\\d+`));
        expect(classes, tone).not.toMatch(SIDE_EDGE);
      }
    }
  });
});
