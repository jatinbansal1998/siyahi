// @ts-check
// OKLCH to sRGB and WCAG 2 contrast, so the theme can be checked without a
// browser. Formulas from Björn Ottosson's OKLab and the WCAG 2.2 definition
// of relative luminance.

/** @typedef {{ l: number, c: number, h: number, alpha: number }} Oklch */

const OKLCH = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i;

/**
 * Parses a CSS `oklch()` value. Returns null for anything else.
 * @param {string} value
 * @returns {Oklch | null}
 */
export function parseOklch(value) {
  const m = OKLCH.exec(value.trim());
  if (!m) return null;
  const l = Number(m[1]) / (m[2] ? 100 : 1);
  const alpha = m[5] === undefined ? 1 : Number(m[5]) / (m[6] ? 100 : 1);
  return { l, c: Number(m[3]), h: Number(m[4]), alpha };
}

/**
 * `color-mix(in oklab, a p%, b)`: a straight line between the two in OKLab, as
 * the browser draws it, returned as OKLCH.
 * @param {Oklch} a @param {Oklch} b @param {number} p share of `a`, 0..1
 * @returns {Oklch}
 */
export function mixOklab(a, b, p) {
  const lab = (/** @type {Oklch} */ { l, c, h }) => [
    l,
    c * Math.cos((h * Math.PI) / 180),
    c * Math.sin((h * Math.PI) / 180),
  ];
  const [l = 0, x = 0, y = 0] = lab(a).map((v, i) => v * p + (lab(b)[i] ?? 0) * (1 - p));
  return { l, c: Math.hypot(x, y), h: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, alpha: 1 };
}

/**
 * Linear-light sRGB channels of an OKLCH colour, before any clipping. A channel
 * outside 0..1 means the colour is outside sRGB.
 * @param {Oklch} color
 * @returns {[number, number, number]}
 */
function linearSrgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ];
  const [cl = 0, cm = 0, cs = 0] = lms;
  return [
    4.0767416621 * cl - 3.3077115913 * cm + 0.2309699292 * cs,
    -1.2684380046 * cl + 2.6097574011 * cm - 0.3413193965 * cs,
    -0.0041960863 * cl - 0.7034186147 * cm + 1.707614701 * cs,
  ];
}

/**
 * Whether a colour is inside sRGB, so every screen paints the value as scored.
 * @param {Oklch} color
 */
export function inSrgb(color) {
  return linearSrgb(color).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

/**
 * Converts OKLCH to gamma-encoded sRGB channels in 0..1, clipped to the gamut.
 * @param {Oklch} color
 * @returns {[number, number, number]}
 */
export function oklchToSrgb(color) {
  const [r, g, bl] = linearSrgb(color).map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  });
  return [r ?? 0, g ?? 0, bl ?? 0];
}

/** @param {number} v */
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/**
 * WCAG relative luminance of gamma-encoded sRGB channels in 0..1.
 * @param {[number, number, number]} rgb
 * @returns {number}
 */
export function luminance([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two opaque OKLCH colours.
 * @param {Oklch} a
 * @param {Oklch} b
 * @returns {number}
 */
export function contrast(a, b) {
  const [hi, lo] = [luminance(oklchToSrgb(a)), luminance(oklchToSrgb(b))].toSorted((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/**
 * Hex form of an OKLCH colour, for messages and tests.
 * @param {Oklch} color
 * @returns {string}
 */
export function toHex(color) {
  return `#${oklchToSrgb(color)
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
