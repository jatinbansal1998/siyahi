/** The signed heat scale a Treemap tile and a ChangeGrid cell share: five steps of gain or loss mixed into the card. */
const DEFAULT_RANGE = 0.05;
export const HEAT_STEPS = 5;

/** The range the heat scale uses: one that is not a positive number falls back to ±5%. */
export const heatRange = (range = DEFAULT_RANGE): number =>
  Number.isFinite(range) && range > 0 ? range : DEFAULT_RANGE;

// Step 1 to 5 mixes the theme's --heat-1 to --heat-5 share of --positive or
// --negative into the card, so each scheme sets its own steps in siyahi.css.
// oklab, not oklch: the card is achromatic, and an oklch mix would swing green
// through orange on its way to it.
export const heatFill = (side: "positive" | "negative", step: number): string =>
  `color-mix(in oklab, var(--${side}) var(--heat-${step}), var(--card))`;

// Five equal steps across ±range. A range that is not a positive number falls
// back to the default rather than painting every tile at one end of the scale.
// A change that is not a finite number (NaN, ±Infinity, such as a division by zero) is no figure, never the deepest.
export function heat(change: number | null, range?: number): string {
  if (!change || !Number.isFinite(change)) return "var(--muted)";
  const step = Math.min(HEAT_STEPS, Math.ceil((Math.abs(change) / heatRange(range)) * HEAT_STEPS));
  return heatFill(change > 0 ? "positive" : "negative", step);
}
