/**
 * Ticks for a log axis at 1, 2 and 5 times a power of ten, from the largest at or under min to the smallest at or
 * over max, so the axis ends on a tick and every label reads as a round number.
 */
export function logTicks(min: number, max: number): number[] {
  if (!(min > 0) || !Number.isFinite(max) || !(max >= min)) return [];
  const ticks: number[] = [];
  for (let decade = Math.floor(Math.log10(min)); ; decade++) {
    for (const step of [1, 2, 5]) {
      // toPrecision keeps 0.1 × 3 from coming out as 0.30000000000000004.
      const tick = Number((step * 10 ** decade).toPrecision(12));
      const next = Number(((step === 5 ? 10 : step === 2 ? 5 : 2) * 10 ** decade).toPrecision(12));
      if (next <= min) continue;
      ticks.push(tick);
      if (tick >= max) return ticks;
    }
  }
}

// Twelve significant digits: enough for any axis label, and it strips the float noise of i × step. `|| 0` turns −0
// into 0, which a formatter would otherwise write as "−0".
const clean = (value: number) => Number(value.toPrecision(12)) || 0;

/**
 * Ticks for a linear axis that just covers min to max, about `count` of them, a step of 1, 2, 2.5 or 5 times a power
 * of ten: −50% to +75% by 25s, never −50% to +150% because the step had to be 50. Values that differ only by float
 * noise, such as 0.3 and 0.30000000000000004, count as one value and get that value as their only tick.
 */
export function linearTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return [];
  if (max - min <= Math.max(Math.abs(min), Math.abs(max)) * 1e-9) return [clean(min)];
  const rough = (max - min) / (count - 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * power >= rough * (1 - 1e-9)) ?? 10) * power;
  // Counting whole steps, with a little slack for float noise, so 0.3 to 0.4 by 0.025 starts at 0.3, not 0.275.
  const first = Math.floor(min / step + 1e-9);
  const last = Math.ceil(max / step - 1e-9);
  return Array.from({ length: last - first + 1 }, (_, i) => clean((first + i) * step));
}

/** How an axis spaces its values: evenly, or by powers of ten for values that run from tiny to large. */
export type AxisScale = "linear" | "log";

/** An axis' ticks for its scale: round steps either way, so a linear axis starting at 0.4% reads 0%, 5%, 10%. */
export const ticksFor = (scale: AxisScale, min: number, max: number): number[] =>
  scale === "log" ? logTicks(min, max) : linearTicks(min, max);

/** A log axis has no place for zero or below, so it can draw a set of values only when every one is above zero. */
export const fitsLog = (values: readonly number[]): boolean => values.length > 0 && values.every((value) => value > 0);
