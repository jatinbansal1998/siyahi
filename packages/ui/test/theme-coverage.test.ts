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
const fadedMuted = new Set([...theme.matchAll(/\[class~="(text-muted-foreground\/\d+)"\]/g)].map(([, cls]) => cls));

/** The class names in a component's source, variants included (`data-open:shadow-md`). */
const classes = (source: string) => [...source.matchAll(/[\w:[\]/.\-()&=*>#]+/g)].map(([token]) => token);

/** Why the theme leaves this class uncovered, or undefined when it covers it. */
function uncovered(token: string): string | undefined {
  // The utility without its variants: `data-open:shadow-md` is `shadow-md`.
  const utility = token.slice(token.lastIndexOf(":") + 1);
  if (/^(drop-shadow|inset-shadow|text-shadow)(-|$)/.test(utility)) return "a shadow kind the theme does not flatten";
  const arbitrary = /^shadow-\[(.+)\]$/.exec(utility)?.[1];
  // A 1px outline with no blur, as the sidebar draws, is an edge, not a shadow.
  if (arbitrary !== undefined) return arbitrary.startsWith("0_0_0_1px_") ? undefined : "an arbitrary shadow";
  const size = /^shadow-([\w-]+)$/.exec(utility)?.[1];
  if (size !== undefined && size !== "none" && !shadowSizes.has(size) && !size.startsWith("("))
    return "a shadow size the theme does not set";
  // The theme restores the whole class name, so a faded class behind a variant (hover:) stays faded.
  if (/^text-muted-foreground\/\d+$/.test(utility) && !(token === utility && fadedMuted.has(utility)))
    return "faded muted text the theme does not restore";
  return undefined;
}

describe("the theme covers every shadcn component", () => {
  it("reads what it covers from siyahi.css", () => {
    expect(shadowSizes.size).toBeGreaterThan(0);
    expect(fadedMuted.size).toBeGreaterThan(0);
  });

  it("leaves no shadow or faded text in a component that the theme does not reach", () => {
    const gaps = readdirSync(ui)
      .filter((file) => file.endsWith(".tsx"))
      .flatMap((file) =>
        classes(readFileSync(path.join(ui, file), "utf8")).flatMap((token) => {
          const reason = uncovered(token);
          return reason ? [`${file}: ${token} is ${reason}`] : [];
        }),
      );
    expect(gaps).toEqual([]);
  });
});
