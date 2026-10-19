/** Formatting settings `SiyahiProvider` carries. */
export interface SiyahiLocale {
  /** BCP 47 tag for numbers and times. `en-IN` groups as 1,53,110 and compacts to ₹2.4L. */
  numberLocale: string;
  /** ISO 4217 currency code. */
  currency: string;
  /** IANA time zone that times are shown in. */
  timeZone: string;
}

export const defaultLocale: SiyahiLocale = {
  numberLocale: "en-IN",
  currency: "INR",
  timeZone: "Asia/Kolkata",
};
