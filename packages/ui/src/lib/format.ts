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

/**
 * A short amount: ₹2.4L and ₹40Cr in en-IN, $2.4M in en-US. Indian readers
 * count in thousands up to a lakh, so in an Indian-region locale amounts under
 * one lakh print in full (₹99,999), never as ₹99.9K. Signed figures belong in
 * `Delta`, which adds the arrow.
 */
export function moneyCompact(value: number, locale: SiyahiLocale = defaultLocale): string {
  if (!regions.has(locale.numberLocale)) regions.set(locale.numberLocale, new Intl.Locale(locale.numberLocale).region);
  if (regions.get(locale.numberLocale) === "IN" && Math.abs(value) < 100_000) return money(value, locale);
  return numberFormat(locale.numberLocale, {
    style: "currency",
    currency: locale.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
  withDate?: boolean;
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
  moneyCompact: (value: number) => string;
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
      moneyCompact: (value) => moneyCompact(value, locale),
      pct: (value, fractionDigits) => pct(value, locale, fractionDigits),
      time: (value, options) => time(value, locale, options),
    }),
    [locale],
  );
}
