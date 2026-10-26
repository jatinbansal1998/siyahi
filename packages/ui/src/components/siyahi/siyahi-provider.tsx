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
  /** Defaults to "ruled". A nested provider sets it for one part of a page. */
  surface?: Surface;
  children: ReactNode;
}

/** Wrap the app once. Carries the locale, the surface and the tooltip provider shadcn asks for. */
export function SiyahiProvider({ locale, surface = "ruled", children }: SiyahiProviderProps) {
  const { numberLocale, currency, timeZone } = { ...defaultLocale, ...locale };
  const value = useMemo(() => ({ numberLocale, currency, timeZone }), [numberLocale, currency, timeZone]);
  return (
    <LocaleContext value={value}>
      <SurfaceContext value={surface}>
        <TooltipProvider>
          {/* The theme reads data-surface to style core Cards; contents keeps the div out of the page's layout. */}
          <div data-slot="siyahi-provider" data-surface={surface} className="contents">
            {children}
          </div>
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
