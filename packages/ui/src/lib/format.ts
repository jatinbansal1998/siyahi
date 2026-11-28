import { useMemo } from "react";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { defaultLocale, type SiyahiLocale } from "@siyahi/ui/lib/locale";

const numbers = new Map<string, Intl.NumberFormat>();
const dates = new Map<string, Intl.DateTimeFormat>();
const locales = new Map<string, Intl.Locale>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify([locale, options]);
  let formatter = numbers.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numbers.set(key, formatter);
  }
  return formatter;
}

function intlLocale(tag: string): Intl.Locale {
  let locale = locales.get(tag);
  if (!locale) {
    locale = new Intl.Locale(tag);
    locales.set(tag, locale);
  }
  return locale;
}

const MINUS = "\u2212";

/** A part's text, with the minus sign `−` where most locales write a hyphen, as DESIGN.md asks. */
function partText({ type, value }: Intl.NumberFormatPart): string {
  // Replace only the hyphen: in Arabic and Hebrew the sign part also carries a direction mark that must stay.
  return type === "minusSign" ? value.replace("-", MINUS) : value;
}

function written(parts: Intl.NumberFormatPart[]): string {
  return parts.map(partText).join("");
}

/**
 * The parts of `value`, unsigned where it rounds to zero: pct(-0.0001) is "0.0%", not "−0.0%". Intl's
 * `signDisplay: "negative"` does this, but Firefox before 116, inside the build's baseline target, throws on it.
 */
function partsOf(formatter: Intl.NumberFormat, value: number): Intl.NumberFormatPart[] {
  const zero = value <= 0 && formatter.format(value) === formatter.format(-0);
  return formatter.formatToParts(zero ? 0 : value);
}

function formatNumber(locale: string, options: Intl.NumberFormatOptions, value: number): string {
  return written(partsOf(numberFormat(locale, options), value));
}

/** −1, 0 or 1: the sign of a change as `write` shows its size, so one that rounds to nothing has none. */
export function signOf(value: number, write: (size: number) => string): -1 | 0 | 1 {
  if (!value || Number.isNaN(value) || write(Math.abs(value)) === write(0)) return 0;
  return value > 0 ? 1 : -1;
}

/** A change with its sign, + or −, and its size written by `write`: `signed(-18400, money)` is "−₹18,400". */
export function signed(value: number, write: (size: number) => string): string {
  const sign = signOf(value, write);
  return `${sign > 0 ? "+" : sign < 0 ? MINUS : ""}${write(Math.abs(value))}`;
}

/** An amount in the locale's currency, whole units by default: ₹1,53,110. Signed figures belong in `Delta`. */
export function money(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 0): string {
  return formatNumber(
    locale.numberLocale,
    {
      style: "currency",
      currency: locale.currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    },
    value,
  );
}

const LAKH = 100_000;
const CRORE = 10_000_000;
const DIGITS = new Set<Intl.NumberFormatPartTypes>(["integer", "fraction"]);
const NUMBER = new Set<Intl.NumberFormatPartTypes>(["integer", "group", "decimal", "fraction"]);

/**
 * An amount of a thousand crore or more, as Indian press and exchanges write it: ₹3,412 Cr with Indian grouping,
 * and from one lakh crore ₹1.2L Cr. Intl's en-IN data writes these as ₹3.4KCr and ₹1.2LCr.
 */
function crores(value: number, locale: SiyahiLocale, size: number, fractionDigits: number | undefined): string {
  const lakhCrore = size >= LAKH * CRORE;
  const figure = formatNumber(
    locale.numberLocale,
    {
      style: "currency",
      currency: locale.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits ?? (lakhCrore ? 1 : 0),
    },
    value / (lakhCrore ? LAKH * CRORE : CRORE),
  );
  return `${figure}${lakhCrore ? "L Cr" : " Cr"}`;
}

/**
 * A short amount: ₹2.4L, ₹40Cr and ₹3,412 Cr in en-IN, $2.4M in en-US. Indian readers count in thousands up to a
 * lakh, so in an Indian-region locale amounts under one lakh print in full (₹99,999), never as ₹99.9K. In English
 * for India, a thousand crore or more stays in crore with Indian grouping (₹48,210 Cr), and from one lakh crore
 * reads in lakh crore (₹1.2L Cr), never ₹3.4KCr. Signed figures belong in `Delta`, which adds the sign and a trend
 * icon.
 *
 * Give `scale`, the largest amount on the same axis, and every tick takes that amount's unit, to two decimals so
 * close ticks stay apart: ₹1.5L, ₹0.75L, ₹0, rather than switching to ₹75,000 halfway up.
 *
 * `fractionDigits` is the most decimals the short figure keeps, for a headline that needs more than the default
 * one (two on an axis, none from a thousand crore): ₹1.245Cr with 3. Amounts printed in full stay in whole units.
 */
export function moneyCompact(
  value: number,
  locale: SiyahiLocale = defaultLocale,
  scale?: number,
  fractionDigits?: number,
): string {
  const { language, region } = intlLocale(locale.numberLocale);
  const size = scale ?? Math.abs(value);
  if (value === 0 || (region === "IN" && size < LAKH)) return money(value, locale);
  if (language === "en" && region === "IN" && size >= 1_000 * CRORE) {
    return crores(value, locale, size, fractionDigits ?? (scale === undefined ? undefined : 2));
  }
  const compact = numberFormat(locale.numberLocale, {
    style: "currency",
    currency: locale.currency,
    notation: "compact",
    maximumFractionDigits: fractionDigits ?? 1,
  });
  if (scale === undefined) return written(partsOf(compact, value));
  // Intl names the unit but not its size: read the size off the scale's own short form, then write this value
  // in that unit inside the same parts, so the currency, unit and sign sit where the locale puts them.
  const parts = compact.formatToParts(Math.sign(value) * scale);
  const shown = Number(
    parts.flatMap((part) => (part.type === "decimal" ? "." : DIGITS.has(part.type) ? part.value : [])).join(""),
  );
  const unit = 10 ** Math.round(Math.log10(scale / shown));
  if (unit === 1) return written(partsOf(compact, value));
  const digits = numberFormat(locale.numberLocale, { maximumFractionDigits: fractionDigits ?? 2 }).format(
    Math.abs(value) / unit,
  );
  const first = parts.findIndex((part) => part.type === "integer");
  return parts
    .flatMap((part, index) => (index === first ? digits : NUMBER.has(part.type) ? [] : partText(part)))
    .join("");
}

/** A whole count with the locale's grouping: 1,53,110 in en-IN. */
export function count(value: number, locale: SiyahiLocale = defaultLocale): string {
  return formatNumber(locale.numberLocale, { maximumFractionDigits: 0 }, value);
}

/** A number with the locale's grouping and exactly `fractionDigits` decimals: an index at 24,312.45, 46.2 points. */
export function fixed(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 2): string {
  return formatNumber(
    locale.numberLocale,
    { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits },
    value,
  );
}

/** A ratio as a multiple, one decimal by default: 2.4×, 0.9×. */
export function multiple(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 1): string {
  return `${fixed(value, locale, fractionDigits)}×`;
}

/** A fraction as a percentage: 0.1234 is 12.3%. */
export function pct(value: number, locale: SiyahiLocale = defaultLocale, fractionDigits = 1): string {
  return formatNumber(
    locale.numberLocale,
    { style: "percent", minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits },
    value,
  );
}

/**
 * A date or time as `options` ask, in the locale's words and its time zone unless `options` names another: 20 Oct
 * 2026. English shortens September to "Sept" in en-IN and en-GB and every other month to three letters; Siyahi
 * writes "Sep", so a short month has one form and one width on every axis and in every tooltip.
 */
export function dateTime(
  value: Date | number | string,
  locale: SiyahiLocale = defaultLocale,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  const resolved = { timeZone: locale.timeZone, ...options };
  const key = JSON.stringify([locale.numberLocale, resolved]);
  let formatter = dates.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale.numberLocale, resolved);
    dates.set(key, formatter);
  }
  return formatter
    .formatToParts(new Date(value))
    .map(({ type, value: part }) => (type === "month" && part === "Sept" ? "Sep" : part))
    .join("");
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
  return dateTime(value, locale, {
    ...date,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  });
}

export interface Formatters {
  count: (value: number) => string;
  money: (value: number, fractionDigits?: number) => string;
  /**
   * Pass `scale` on an axis so every tick shares one unit; a chart's yTickFormatter gets it as its second argument.
   * Pass `fractionDigits` for a headline that needs more decimals: `moneyCompact(12_450_000, undefined, 3)` is ₹1.245Cr.
   */
  moneyCompact: (value: number, scale?: number, fractionDigits?: number) => string;
  /** Exactly `fractionDigits` decimals, two by default, with the locale's grouping: `fixed(24312.45)` is 24,312.45. */
  fixed: (value: number, fractionDigits?: number) => string;
  /** One decimal by default: `multiple(2.4)` is 2.4×. */
  multiple: (value: number, fractionDigits?: number) => string;
  pct: (value: number, fractionDigits?: number) => string;
  time: (value: Date | number | string, options?: TimeOptions) => string;
  /** A date by default, 20 Oct 2026; `options` as Intl's, such as `{ month: "short", timeZone: "UTC" }` for a month. */
  dateTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
}

/** The formatters above, bound to the locale of the nearest `SiyahiProvider`. */
export function useFormat(): Formatters {
  const locale = useLocale();
  return useMemo(
    () => ({
      count: (value) => count(value, locale),
      money: (value, fractionDigits) => money(value, locale, fractionDigits),
      moneyCompact: (value, scale, fractionDigits) => moneyCompact(value, locale, scale, fractionDigits),
      fixed: (value, fractionDigits) => fixed(value, locale, fractionDigits),
      multiple: (value, fractionDigits) => multiple(value, locale, fractionDigits),
      pct: (value, fractionDigits) => pct(value, locale, fractionDigits),
      time: (value, options) => time(value, locale, options),
      dateTime: (value, options) => dateTime(value, locale, options),
    }),
    [locale],
  );
}
