import { useMemo } from "react";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { defaultLocale, type SiyahiLocale } from "@siyahi/ui/lib/locale";

const numbers = new Map<string, Intl.NumberFormat>();
const clocks = new Map<string, Intl.DateTimeFormat>();
const regions = new Map<string, string | undefined>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify([locale, options]);
  let formatter = numbers.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numbers.set(key, formatter);
  }
  return formatter;
}

/** An amount in the locale's currency, whole units by default: ₹1,53,110. Signed figures belong in `Delta`. */
export function money(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 0): string {
  return numberFormat(locale.numberLocale, {
    style: "currency",
    currency: locale.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

const DIGITS = new Set<Intl.NumberFormatPartTypes>(["integer", "fraction"]);
const NUMBER = new Set<Intl.NumberFormatPartTypes>(["integer", "group", "decimal", "fraction"]);

/**
 * A short amount: ₹2.4L and ₹40Cr in en-IN, $2.4M in en-US. Indian readers
 * count in thousands up to a lakh, so in an Indian-region locale amounts under
 * one lakh print in full (₹99,999), never as ₹99.9K. Signed figures belong in
 * `Delta`, which adds the sign and a trend icon.
 *
 * Give `scale`, the largest amount on the same axis, and every tick takes that
 * amount's unit, to two decimals so close ticks stay apart: ₹1.5L, ₹0.75L,
 * ₹0, rather than switching to ₹75,000 halfway up.
 */
export function moneyCompact(value: number, locale: SiyahiLocale = defaultLocale, scale?: number): string {
  if (!regions.has(locale.numberLocale)) regions.set(locale.numberLocale, new Intl.Locale(locale.numberLocale).region);
  if (regions.get(locale.numberLocale) === "IN" && (scale ?? Math.abs(value)) < 100_000) return money(value, locale);
  const compact = numberFormat(locale.numberLocale, {
    style: "currency",
    currency: locale.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });
  if (scale === undefined || value === 0) return compact.format(value);
  // Intl names the unit but not its size: read the size off the scale's own short form, then write this value
  // in that unit inside the same parts, so the currency, unit and sign sit where the locale puts them.
  const parts = compact.formatToParts(Math.sign(value) * scale);
  const shown = Number(
    parts.flatMap((part) => (part.type === "decimal" ? "." : DIGITS.has(part.type) ? part.value : [])).join(""),
  );
  const unit = 10 ** Math.round(Math.log10(scale / shown));
  if (unit === 1) return compact.format(value);
  const digits = numberFormat(locale.numberLocale, { maximumFractionDigits: 2 }).format(Math.abs(value) / unit);
  const first = parts.findIndex((part) => part.type === "integer");
  return parts.flatMap((part, index) => (index === first ? digits : NUMBER.has(part.type) ? [] : part.value)).join("");
}

/** A whole count with the locale's grouping: 1,53,110 in en-IN. */
export function count(value: number, locale: SiyahiLocale = defaultLocale): string {
  return numberFormat(locale.numberLocale, { maximumFractionDigits: 0 }).format(value);
}

/** A fraction as a percentage: 0.1234 is 12.3%. */
export function pct(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 1): string {
  return numberFormat(locale.numberLocale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export interface TimeOptions {
  /** Write the date, in the same zone, before the time: 20 Oct 2026, 14:30 IST. */
  withDate?: boolean | undefined;
}

/** A 24-hour time in the locale's zone, with the zone written: 14:30 IST. */
export function time(
  value: Date | number | string,
  locale: SiyahiLocale = defaultLocale,
  { withDate = false }: TimeOptions = {},
): string {
  const date: Intl.DateTimeFormatOptions = withDate ? { day: "numeric", month: "short", year: "numeric" } : {};
  const options: Intl.DateTimeFormatOptions = {
    ...date,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: locale.timeZone,
    timeZoneName: "short",
  };
  const key = JSON.stringify([locale.numberLocale, options]);
  let formatter = clocks.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale.numberLocale, options);
    clocks.set(key, formatter);
  }
  return formatter.format(new Date(value));
}

export interface Formatters {
  count: (value: number) => string;
  money: (value: number, fractionDigits?: number) => string;
  /** Pass `scale` on an axis so every tick shares one unit; a chart's yTickFormatter gets it as its second argument. */
  moneyCompact: (value: number, scale?: number) => string;
  pct: (value: number, fractionDigits?: number) => string;
  time: (value: Date | number | string, options?: TimeOptions) => string;
}

/** The formatters above, bound to the locale of the nearest `SiyahiProvider`. */
export function useFormat(): Formatters {
  const locale = useLocale();
  return useMemo(
    () => ({
      count: (value) => count(value, locale),
      money: (value, fractionDigits) => money(value, locale, fractionDigits),
      moneyCompact: (value, scale) => moneyCompact(value, locale, scale),
      pct: (value, fractionDigits) => pct(value, locale, fractionDigits),
      time: (value, options) => time(value, locale, options),
    }),
    [locale],
  );
}
