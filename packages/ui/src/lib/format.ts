import { useMemo } from "react";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { defaultLocale, type SiyahiLocale } from "@siyahi/ui/lib/locale";

/** An amount in the locale's currency, whole units by default: ₹1,53,110. Signed figures belong in `Delta`. */
export function money(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale.numberLocale, {
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
  if (new Intl.Locale(locale.numberLocale).region === "IN" && Math.abs(value) < 100_000) return money(value, locale);
  return new Intl.NumberFormat(locale.numberLocale, {
    style: "currency",
    currency: locale.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** A fraction as a percentage: 0.1234 is 12.3%. */
export function pct(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 1): string {
  return new Intl.NumberFormat(locale.numberLocale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** A 24-hour time in the locale's zone, with the zone written: 14:30 IST. */
export function time(value: Date | number | string, locale: SiyahiLocale = defaultLocale): string {
  return new Intl.DateTimeFormat(locale.numberLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: locale.timeZone,
    timeZoneName: "short",
  }).format(new Date(value));
}

export interface Formatters {
  money: (value: number, fractionDigits?: number) => string;
  moneyCompact: (value: number) => string;
  pct: (value: number, fractionDigits?: number) => string;
  time: (value: Date | number | string) => string;
}

/** The formatters above, bound to the locale of the nearest `SiyahiProvider`. */
export function useFormat(): Formatters {
  const locale = useLocale();
  return useMemo(
    () => ({
      money: (value, fractionDigits) => money(value, locale, fractionDigits),
      moneyCompact: (value) => moneyCompact(value, locale),
      pct: (value, fractionDigits) => pct(value, locale, fractionDigits),
      time: (value) => time(value, locale),
    }),
    [locale],
  );
}
