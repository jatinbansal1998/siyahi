import { createContext, use, useMemo, type ReactNode } from "react";
import { TooltipProvider } from "@siyahi/ui/components/ui/tooltip";
import { defaultLocale, type SiyahiLocale } from "@siyahi/ui/lib/locale";
import type { Optional } from "@siyahi/ui/lib/optional";

const LocaleContext = createContext<SiyahiLocale>(defaultLocale);

export interface SiyahiProviderProps {
  /** Any setting left out keeps its default: en-IN, INR, Asia/Kolkata. */
  locale?: Optional<SiyahiLocale> | undefined;
  children: ReactNode;
}

/**
 * Wrap the app once. Carries the locale and the tooltip provider shadcn asks for, and draws no element of its own, so
 * a provider that changes the locale for a table's rows can sit inside a <tbody>.
 */
export function SiyahiProvider({ locale, children }: SiyahiProviderProps) {
  const {
    numberLocale = defaultLocale.numberLocale,
    currency = defaultLocale.currency,
    timeZone = defaultLocale.timeZone,
  } = locale ?? {};
  const value = useMemo(() => ({ numberLocale, currency, timeZone }), [numberLocale, currency, timeZone]);
  return (
    <LocaleContext value={value}>
      <TooltipProvider>{children}</TooltipProvider>
    </LocaleContext>
  );
}

export function useLocale(): SiyahiLocale {
  return use(LocaleContext);
}
