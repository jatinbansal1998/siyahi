import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";
import { describe, expect, it } from "vite-plus/test";

const theme = fileURLToPath(new URL("../styles/siyahi.css", import.meta.url));

// Tailwind 4.3 keeps --max-width-prose in its deprecated theme block. If a
// release drops it, max-w-prose falls back to 65ch, which follows whichever
// font is drawing, and prose rewraps again when Geist swaps in.
describe("max-w-prose", () => {
  it("is 43.1em, not a ch width", async () => {
    const compiler = await compile(readFileSync(theme, "utf8"), {
      base: fileURLToPath(new URL("../styles", import.meta.url)),
      onDependency: () => {},
    });
    expect(compiler.build(["max-w-prose"])).toMatch(/\.max-w-prose\s*\{\s*max-width:\s*43\.1em;/);
  });
});
