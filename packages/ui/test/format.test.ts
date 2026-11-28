import { describe, expect, it, vi } from "vite-plus/test";
import {
  count,
  countCompact,
  dateTime,
  fixed,
  money,
  moneyCompact,
  multiple,
  number,
  pct,
  signed,
  time,
} from "../src/lib/format";
import type { SiyahiLocale } from "../src/lib/locale";

const us: SiyahiLocale = { numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" };
const nineUtc = "2026-10-20T09:00:00Z";

it("reuses a currency formatter across values and equivalent locale objects", () => {
  const locale: SiyahiLocale = { numberLocale: "en-GB", currency: "GBP", timeZone: "Europe/London" };
  const constructor = vi.spyOn(Intl, "NumberFormat");
  try {
    expect(money(123.4, locale, 3)).toBe("£123.400");
    expect(money(567.8, { ...locale }, 3)).toBe("£567.800");
    expect(constructor).toHaveBeenCalledTimes(1);
  } finally {
    constructor.mockRestore();
  }
});

it("reuses a clock formatter while keeping date and time-only formats separate", () => {
  const locale: SiyahiLocale = { numberLocale: "en-GB", currency: "GBP", timeZone: "Europe/London" };
  const constructor = vi.spyOn(Intl, "DateTimeFormat");
  try {
    expect(time(nineUtc, locale)).toBe("10:00 BST");
    expect(time(nineUtc, { ...locale })).toBe("10:00 BST");
    expect(time(nineUtc, locale, { withDate: true })).toBe("20 Oct 2026, 10:00 BST");
    expect(constructor).toHaveBeenCalledTimes(2);
  } finally {
    constructor.mockRestore();
  }
});

describe("default locale (en-IN, INR, Asia/Kolkata)", () => {
  it("writes September's short form as Sep, three letters like every other month", () => {
    expect(dateTime(nineUtc)).toBe("20 Oct 2026");
    expect(dateTime("2026-09-20T09:00:00Z")).toBe("20 Sep 2026");
    expect(dateTime("2026-09-20T09:00:00Z", undefined, { month: "short" })).toBe("Sep");
    expect(time("2026-09-20T09:00:00Z", undefined, { withDate: true })).toBe("20 Sep 2026, 14:30 IST");
  });

  it("groups money in lakhs", () => {
    expect(money(153110)).toBe("₹1,53,110");
  });

  it("groups a count in lakhs", () => {
    expect(count(153110)).toBe("1,53,110");
  });

  it("rounds money to whole rupees unless asked for paise", () => {
    expect(money(153110.6)).toBe("₹1,53,111");
    expect(money(153110.6, undefined, 2)).toBe("₹1,53,110.60");
  });

  it("compacts to lakh and crore", () => {
    expect(moneyCompact(100000)).toBe("₹1L");
    expect(moneyCompact(240000)).toBe("₹2.4L");
    expect(moneyCompact(400000000)).toBe("₹40 Cr");
  });

  it("prints amounts under one lakh in full, never as K", () => {
    expect(moneyCompact(1000)).toBe("₹1,000");
    expect(moneyCompact(99999)).toBe("₹99,999");
  });

  it("writes every tick on an axis in the unit of its largest", () => {
    expect([160000, 120000, 80000, 40000, 0].map((tick) => moneyCompact(tick, undefined, 160000))).toEqual([
      "₹1.6L",
      "₹1.2L",
      "₹0.8L",
      "₹0.4L",
      "₹0",
    ]);
    expect(moneyCompact(-75000, undefined, 150000)).toBe("−₹0.75L");
    expect(moneyCompact(50000, undefined, 90000)).toBe("₹50,000");
    expect(moneyCompact(500000, us, 1500000)).toBe("$0.5M");
  });

  it("keeps the sign on negative compact amounts", () => {
    expect(moneyCompact(-240000)).toBe("−₹2.4L");
    expect(moneyCompact(-50000)).toBe("−₹50,000");
  });

  it("writes a thousand crore and more in crore with Indian grouping, never K Cr", () => {
    expect(moneyCompact(34_120_000_000)).toBe("₹3,412 Cr");
    expect(moneyCompact(482_100_000_000)).toBe("₹48,210 Cr");
    expect(moneyCompact(4_120_000_000)).toBe("₹412 Cr");
  });

  it("writes crore after a space at every size, so two crore figures read as one unit", () => {
    expect([9_000_000_000, 21_000_000_000].map((amount) => moneyCompact(amount))).toEqual(["₹900 Cr", "₹2,100 Cr"]);
    expect(moneyCompact(4_126_000_000)).toBe("₹412.6 Cr");
    expect(moneyCompact(-9_000_000_000)).toBe("−₹900 Cr");
    expect([500_000_000, 250_000_000, 0].map((tick) => moneyCompact(tick, undefined, 500_000_000))).toEqual([
      "₹50 Cr",
      "₹25 Cr",
      "₹0",
    ]);
  });

  it("writes an amount that rounds up into the next unit in that unit", () => {
    expect([9_999_999, 9_999_999_999, 999_999_600_000].map((amount) => moneyCompact(amount))).toEqual([
      "₹1 Cr",
      "₹1,000 Cr",
      "₹1L Cr",
    ]);
  });

  it("writes a lakh crore and more in lakh crore", () => {
    expect(moneyCompact(1_200_000_000_000)).toBe("₹1.2L Cr");
    expect(moneyCompact(19_500_000_000_000)).toBe("₹19.5L Cr");
  });

  it("writes every tick on a thousand-crore axis in crore", () => {
    expect([50_000_000_000, 12_500_000_000, 0].map((tick) => moneyCompact(tick, undefined, 50_000_000_000))).toEqual([
      "₹5,000 Cr",
      "₹1,250 Cr",
      "₹0",
    ]);
    expect(moneyCompact(500_000_000_000, undefined, 2_000_000_000_000)).toBe("₹0.5L Cr");
  });

  it("keeps more decimals in a short amount when asked", () => {
    expect(moneyCompact(12_450_000)).toBe("₹1.2 Cr");
    expect(moneyCompact(12_450_000, undefined, undefined, 3)).toBe("₹1.245 Cr");
  });

  it("writes a count short in lakh and crore, and under a lakh in full", () => {
    expect([40_000, 400_000, 12_450_000, 34_120_000_000, 1_200_000_000_000].map((n) => countCompact(n))).toEqual([
      "40,000",
      "4L",
      "1.2 Cr",
      "3,412 Cr",
      "1.2L Cr",
    ]);
  });

  it("writes every count on an axis in the unit of its largest, with the minus sign", () => {
    expect([400_000, 50_000, 0, -200_000].map((tick) => countCompact(tick, undefined, 400_000))).toEqual([
      "4L",
      "0.5L",
      "0",
      "−2L",
    ]);
  });

  it("writes a number with grouping and a fixed count of decimals", () => {
    expect(fixed(24312.45)).toBe("24,312.45");
    expect(fixed(2431245.5)).toBe("24,31,245.50");
    expect(fixed(46, undefined, 1)).toBe("46.0");
  });

  it("writes a number with grouping and only the decimals it has, up to three", () => {
    expect(number(153110)).toBe("1,53,110");
    expect(number(0.25)).toBe("0.25");
    expect(number(1.23456)).toBe("1.235");
    expect(number(-1500.5)).toBe("−1,500.5");
  });

  it("writes a ratio as a multiple", () => {
    expect(multiple(2.4)).toBe("2.4×");
    expect(multiple(0.9)).toBe("0.9×");
    expect(multiple(2)).toBe("2.0×");
  });

  it("writes a negative figure with the minus sign, never a hyphen", () => {
    expect(money(-18400)).toBe("−₹18,400");
    expect(count(-5)).toBe("−5");
    expect(pct(-0.02)).toBe("−2.0%");
    expect(fixed(-46.2, undefined, 1)).toBe("−46.2");
    expect(moneyCompact(-34_120_000_000)).toBe("−₹3,412 Cr");
    expect(moneyCompact(-2400000, us)).toBe("−$2.4M");
  });

  it("writes a negative that rounds to zero as zero, with no sign", () => {
    expect(pct(-0.0001)).toBe("0.0%");
    expect(money(-0.4)).toBe("₹0");
    expect(count(-0)).toBe("0");
    expect(fixed(-0.001)).toBe("0.00");
    expect(moneyCompact(-0.4)).toBe("₹0");
    expect(moneyCompact(-40, us)).toBe("−$40");
    expect(moneyCompact(-0.004, us)).toBe("$0");
    // The smallest negative that does not round away keeps its sign.
    expect(pct(-0.0005)).toBe("−0.1%");
  });

  it("writes a change with + or the minus sign, and none where its size rounds to zero", () => {
    expect(signed(21300, money)).toBe("+₹21,300");
    expect(signed(-0.021, pct)).toBe("−2.1%");
    expect(signed(-0.0001, pct)).toBe("0.0%");
    expect(signed(0, money)).toBe("₹0");
  });

  it("formats a fraction as a percentage with one decimal", () => {
    expect(pct(0.1234)).toBe("12.3%");
    expect(pct(-0.005)).toBe("−0.5%");
  });

  it("writes a 24-hour time in IST with the zone", () => {
    expect(time(nineUtc)).toBe("14:30 IST");
  });

  it("writes the date in the same zone before the time when asked", () => {
    expect(time(nineUtc, undefined, { withDate: true })).toBe("20 Oct 2026, 14:30 IST");
    expect(time("2026-10-20T20:00:00Z", undefined, { withDate: true })).toBe("21 Oct 2026, 01:30 IST");
  });
});

describe("another locale", () => {
  it("follows the locale it is given", () => {
    expect(count(153110, us)).toBe("153,110");
    expect(money(153110, us)).toBe("$153,110");
    expect(moneyCompact(2400000, us)).toBe("$2.4M");
    expect(moneyCompact(1000, us)).toBe("$1K");
    expect(countCompact(400_000, us)).toBe("400K");
    expect(countCompact(-250_000, us, 400_000)).toBe("−250K");
    expect(moneyCompact(34_120_000_000, us)).toBe("$34.1B");
    expect(moneyCompact(34_120_000_000, { ...us, numberLocale: "hi-IN", currency: "INR" })).toBe("₹34.1\u00a0अ॰");
    expect(time(nineUtc, us)).toBe("05:00 EDT");
    expect(time(nineUtc, us, { withDate: true })).toBe("Oct 20, 2026, 05:00 EDT");
  });
});
