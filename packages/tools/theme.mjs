// @ts-check
// Reads the custom properties of a Siyahi theme file: the top-level `:root`
// block for light, and the `@variant dark { … }` block nested inside it for
// dark. Dark holds only what its own block declares: a token the dark block
// forgets must fail the checks, not borrow its light value.

/** @typedef {Record<string, string>} Variables */
/** @typedef {{ light: Variables, dark: Variables }} Theme */

/**
 * The text between the brace that opens at `open` and its matching close.
 * @param {string} css @param {number} open
 */
function blockAt(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error("theme has an unclosed block");
}

/**
 * @param {string} body
 * @returns {Variables}
 */
function declarations(body) {
  /** @type {Variables} */
  const vars = {};
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    if (m[1] && m[2]) vars[m[1]] = m[2].trim();
  }
  return vars;
}

/**
 * @param {string} css
 * @returns {Theme}
 */
export function readTheme(css) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rootAt = source.search(/(?:^|\n):root\s*\{/);
  if (rootAt === -1) throw new Error("theme has no top-level :root block");
  const root = blockAt(source, source.indexOf("{", rootAt));
  const variantAt = root.search(/@variant\s+dark\s*\{/);
  if (variantAt === -1) throw new Error("theme has no `@variant dark { … }` block inside :root");
  const dark = blockAt(root, root.indexOf("{", variantAt));
  const light = root.replace(`{${dark}}`, "{}");
  return { light: declarations(light), dark: declarations(dark) };
}
