// JetBrains Mono, the theme's page face, draws every character 6.64px wide at text-xs, at any weight, where the
// browser places glyphs at fractions of a pixel, and 7px where it rounds each advance to a whole one (Chromium on
// Linux, measured). Plan for the wider; a label longer than its box ends in an ellipsis instead of being cut
// mid-letter by the box's clip.
const CHAR_PX = 7;

/** About how wide a text-xs label in the mono draws, in pixels. */
export const textWidth = (text: string): number => text.length * CHAR_PX;

/** The label, cut with an ellipsis when it would draw wider than `width` pixels at text-xs. */
export function fit(text: string, width: number): string {
  const room = Math.floor(width / CHAR_PX);
  return text.length <= room ? text : `${text.slice(0, Math.max(room - 1, 1)).trimEnd()}…`;
}
