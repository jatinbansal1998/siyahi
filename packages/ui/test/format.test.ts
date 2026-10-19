import { describe, expect, it } from "vite-plus/test";
import { money, moneyCompact, pct, time } from "../src/lib/format";
import type { SiyahiLocale } from "../src/lib/locale";

const us: SiyahiLocale = { numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" };
const nineUtc = "2026-10-20T09:00:00Z";

describe("default locale (en-IN, INR, Asia/Kolkata)", () => {
  it("groups money in lakhs", () => {
    expect(money(153110)).toBe("₹1,53,110");
  });

  it("rounds money to whole rupees unless asked for paise", () => {
    expect(money(153110.6)).toBe("₹1,53,111");
    expect(money(153110.6, undefined, 2)).toBe("₹1,53,110.60");
  });

  it("compacts to lakh and crore", () => {
    expect(moneyCompact(240000)).toBe("₹2.4L");
    expect(moneyCompact(400000000)).toBe("₹40Cr");
  });

  it("formats a fraction as a percentage with one decimal", () => {
    expect(pct(0.1234)).toBe("12.3%");
    expect(pct(-0.005)).toBe("-0.5%");
  });

  it("writes a 24-hour time in IST with the zone", () => {
    expect(time(nineUtc)).toBe("14:30 IST");
  });
});

describe("another locale", () => {
  it("follows the locale it is given", () => {
    expect(money(153110, us)).toBe("$153,110");
    expect(moneyCompact(2400000, us)).toBe("$2.4M");
    expect(time(nineUtc, us)).toBe("05:00 EDT");
  });
});
