/** The signed heat scale a Treemap tile and a ChangeGrid cell share: five steps of gain or loss mixed into the card. */
const DEFAULT_RANGE = 0.05;
export const HEAT_STEPS = 5;

/** The range the heat scale uses: one that is not a positive number falls back to ±5%. */
export const heatRange = (range = DEFAULT_RANGE): number =>
  Number.isFinite(range) && range > 0 ? range : DEFAULT_RANGE;

// Step 1 to 5: 12% to 60% of --positive or --negative mixed into the card, and
// 25% to 60% in dark, where a 12% tint of a dark card reads as the card itself.
// oklab, not oklch: the card is achromatic, and an oklch mix would swing green
// through orange on its way to it.
const DARK_FLOOR = 25;
const TOP = HEAT_STEPS * 12;
export const heatFill = (side: "positive" | "negative", step: number): string => {
  const mix = (share: number) => `color-mix(in oklab, var(--${side}) ${share}%, var(--card))`;
  const dark = DARK_FLOOR + ((step - 1) * (TOP - DARK_FLOOR)) / (HEAT_STEPS - 1);
  return `light-dark(${mix(step * 12)}, ${mix(dark)})`;
};

// Five equal steps across ±range. A range that is not a positive number falls
// back to the default rather than painting every tile at one end of the scale.
// A change that is not a finite number (NaN, ±Infinity, such as a division by zero) is no figure, never the deepest.
export function heat(change: number | null, range?: number): string {
  if (!change || !Number.isFinite(change)) return "var(--muted)";
  const step = Math.min(HEAT_STEPS, Math.ceil((Math.abs(change) / heatRange(range)) * HEAT_STEPS));
  return heatFill(change > 0 ? "positive" : "negative", step);
}
