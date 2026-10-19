import { createContext, use, useMemo, type ReactNode } from "react";
import { TooltipProvider } from "@siyahi/ui/components/ui/tooltip";
import { defaultLocale, type SiyahiLocale } from "@siyahi/ui/lib/locale";

const LocaleContext = createContext<SiyahiLocale>(defaultLocale);

export interface SiyahiProviderProps {
  /** Any setting left out keeps its default: en-IN, INR, Asia/Kolkata. */
  locale?: Partial<SiyahiLocale>;
  children: ReactNode;
}

/** Wrap the app once. Carries the locale and the tooltip provider shadcn asks for. */
export function SiyahiProvider({ locale, children }: SiyahiProviderProps) {
  const { numberLocale, currency, timeZone } = { ...defaultLocale, ...locale };
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
