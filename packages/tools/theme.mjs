// @ts-check
// Reads the custom properties of a Siyahi theme file: the top-level `:root`
// block for light, and the `:root` block inside
// `@media (prefers-color-scheme: dark)` for dark. Dark inherits every light
// value it does not override, as the cascade would.

/** @typedef {Record<string, string>} Variables */
/** @typedef {{ light: Variables, dark: Variables }} Theme */

const DARK_MEDIA = /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{\s*:root\s*\{([^}]*)\}/;
const LIGHT_ROOT = /(?:^|\n):root\s*\{([^}]*)\}/;

/**
 * @param {string} body
 * @returns {Variables}
 */
function declarations(body) {
  /** @type {Variables} */
  const vars = {};
  const withoutComments = body.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of withoutComments.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    if (m[1] && m[2]) vars[m[1]] = m[2].trim();
  }
  return vars;
}

/**
 * @param {string} css
 * @returns {Theme}
 */
export function readTheme(css) {
  const light = LIGHT_ROOT.exec(css)?.[1];
  const dark = DARK_MEDIA.exec(css)?.[1];
  if (light === undefined) throw new Error("theme has no top-level :root block");
  if (dark === undefined) throw new Error("theme has no :root block under prefers-color-scheme: dark");
  const lightVars = declarations(light);
  return { light: lightVars, dark: { ...lightVars, ...declarations(dark) } };
}
