import type { ReactNode } from "react";

export interface PageHeroProps {
  /** A short line above the title in the link colour, such as a package or a section name. */
  eyebrow?: ReactNode;
  /** The page's h1, set large. */
  title: ReactNode;
  /** What the page is, in a sentence or two, in the body colour. */
  lead?: ReactNode;
  /** Muted detail under the lead: scope, sources, what is left out. */
  detail?: ReactNode;
  /** The one or two places a reader goes next, usually a primary Button and an outline one. */
  actions?: ReactNode;
  /**
   * A large decorative mark drawn faintly in the accent behind the top right, such as the product's logo as an
   * SVG that paints with currentColor. It is hidden from assistive technology.
   */
  mark?: ReactNode;
}

/**
 * The introduction at the top of a front page or a long explainer: a large title, what the page is, and where to
 * go next, on a card with an optional watermark. One per page, above everything else; a section uses PageSection.
 */
export function PageHero({ eyebrow, title, lead, detail, actions, mark }: PageHeroProps) {
  return (
    <header
      data-slot="page-hero"
      className="relative isolate flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card px-6 py-8 sm:px-10 sm:py-10"
    >
      {mark && (
        // The page's one large mark of identity, in the accent and faint enough to read over.
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-10 -z-10 size-80 text-chart-1 opacity-10 sm:-top-12 sm:right-4 [&>svg]:size-full"
        >
          {mark}
        </div>
      )}
      {eyebrow && <p className="font-mono text-xs text-link">{eyebrow}</p>}
      <h1 className="text-5xl font-semibold tracking-tighter text-balance sm:text-6xl">{title}</h1>
      {lead && <div className="max-w-xl text-lg text-pretty">{lead}</div>}
      {detail && <div className="max-w-xl text-pretty text-muted-foreground">{detail}</div>}
      {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
