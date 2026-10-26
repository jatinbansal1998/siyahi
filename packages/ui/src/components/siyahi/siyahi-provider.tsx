import { createContext, use, useMemo, type ReactNode } from "react";
import { TooltipProvider } from "@siyahi/ui/components/ui/tooltip";
import { defaultLocale, type SiyahiLocale } from "@siyahi/ui/lib/locale";

/**
 * How a data block sits on the page. "ruled": no box, hairlines between blocks in a PanelGrid. "open": no box and no
 * lines, the block's content level with the page's text. "card": shadcn's own card, a filled box with a 1px ring.
 */
export type Surface = "ruled" | "open" | "card";

const LocaleContext = createContext<SiyahiLocale>(defaultLocale);
const SurfaceContext = createContext<Surface>("ruled");

export interface SiyahiProviderProps {
  /** Any setting left out keeps its default: en-IN, INR, Asia/Kolkata. */
  locale?: Partial<SiyahiLocale>;
  /**
   * Set it on a nested provider for one part of a page. Left out, a provider keeps the surface around it, so a
   * provider that only changes the locale changes nothing else; the outermost default is "ruled".
   */
  surface?: Surface;
  children: ReactNode;
}

/** Wrap the app once. Carries the locale, the surface and the tooltip provider shadcn asks for. */
export function SiyahiProvider({ locale, surface, children }: SiyahiProviderProps) {
  const { numberLocale, currency, timeZone } = { ...defaultLocale, ...locale };
  const value = useMemo(() => ({ numberLocale, currency, timeZone }), [numberLocale, currency, timeZone]);
  const around = use(SurfaceContext);
  return (
    <LocaleContext value={value}>
      <SurfaceContext value={surface ?? around}>
        <TooltipProvider>
          {/*
           * The theme reads data-surface to style core Cards, and contents keeps the div out of the page's layout.
           * Only a provider that sets a surface draws it: one that changes the locale for a table's rows sits
           * inside a <tbody>, where a div is not allowed.
           */}
          {surface ? (
            <div data-slot="siyahi-provider" data-surface={surface} className="contents">
              {children}
            </div>
          ) : (
            children
          )}
        </TooltipProvider>
      </SurfaceContext>
    </LocaleContext>
  );
}

export function useLocale(): SiyahiLocale {
  return use(LocaleContext);
}

export function useSurface(): Surface {
  return use(SurfaceContext);
}
