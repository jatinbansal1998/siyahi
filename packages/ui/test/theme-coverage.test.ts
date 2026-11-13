import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

// The house look reaches shadcn's components through the theme, not per component (CONTRIBUTING.md, "The look is
// global"). A refreshed or newly added component could bring a class the theme does not cover, and nothing would
// fail but the look; this reads what the theme covers from siyahi.css and fails on anything else.
const ui = fileURLToPath(new URL("../src/components/ui", import.meta.url));
const theme = readFileSync(fileURLToPath(new URL("../styles/siyahi.css", import.meta.url)), "utf8");

const shadowSizes = new Set([...theme.matchAll(/--shadow-([\w-]+): 0 0 #0000;/g)].map(([, size]) => size));
const edges = new Set([...theme.matchAll(/\[class\*="(ring-foreground\/\d+)"\]/g)].map(([, edge]) => edge));
const fadedMuted = new Set([...theme.matchAll(/\[class~="(text-muted-foreground\/\d+)"\]/g)].map(([, cls]) => cls));

/** The utility each class names, without its variants: `data-open:shadow-md` is `shadow-md`. */
const utilities = (source: string) =>
  [...source.matchAll(/[\w:[\]/.\-()&=*>]+/g)].map(([token]) => token.slice(token.lastIndexOf(":") + 1));

/** Why the theme leaves this utility uncovered, or undefined when it covers it. */
function uncovered(utility: string): string | undefined {
  if (/^(drop-shadow|inset-shadow|text-shadow)(-|$)/.test(utility)) return "a shadow kind the theme does not flatten";
  const arbitrary = /^shadow-\[(.+)\]$/.exec(utility)?.[1];
  // A 1px outline with no blur, as the sidebar draws, is an edge, not a shadow.
  if (arbitrary !== undefined) return /^0_0_0_1px_/.test(arbitrary) ? undefined : "an arbitrary shadow";
  const size = /^shadow-([\w-]+)$/.exec(utility)?.[1];
  if (size !== undefined && size !== "none" && !shadowSizes.has(size) && !size.startsWith("("))
    return "a shadow size the theme does not set";
  if (/^ring-foreground\/\d+$/.test(utility) && !edges.has(utility)) return "an edge the theme does not recolour";
  if (/^text-muted-foreground\/\d+$/.test(utility) && !fadedMuted.has(utility))
    return "faded muted text the theme does not restore";
  return undefined;
}

describe("the theme covers every shadcn component", () => {
  it("reads what it covers from siyahi.css", () => {
    expect(shadowSizes.size).toBeGreaterThan(0);
    expect(edges.size).toBeGreaterThan(0);
    expect(fadedMuted.size).toBeGreaterThan(0);
  });

  it("leaves no shadow, edge or faded text in a component that the theme does not reach", () => {
    const gaps = readdirSync(ui)
      .filter((file) => file.endsWith(".tsx"))
      .flatMap((file) =>
        utilities(readFileSync(path.join(ui, file), "utf8")).flatMap((utility) => {
          const reason = uncovered(utility);
          return reason ? [`${file}: ${utility} is ${reason}`] : [];
        }),
      );
    expect(gaps).toEqual([]);
  });
});
