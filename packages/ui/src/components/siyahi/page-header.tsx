import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** A short line above the title in the mono face and the link colour, such as the app or a section name. */
  eyebrow?: ReactNode;
  /** The page's h1. */
  title: ReactNode;
  /** What the page is, in a sentence, in the muted colour. */
  lead?: ReactNode;
  /** Scope, sources or what is left out, run on after the lead in the same muted line. */
  detail?: ReactNode;
  /** The one or two places a reader goes next, usually a primary Button and an outline one, at the right. */
  actions?: ReactNode;
  /** A small mark before the eyebrow, such as the product's logo as an SVG that paints with currentColor. */
  mark?: ReactNode;
}

/**
 * The masthead at the top of a page: a small mark and eyebrow, the title, one muted line saying what the page is,
 * the actions at the right, and a hairline under it all. One per page, above everything else; a section uses
 * PageSection.
 */
export function PageHeader({ eyebrow, title, lead, detail, actions, mark }: PageHeaderProps) {
  return (
    <header data-slot="page-header" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b pb-4">
      <div className="flex min-w-0 flex-col gap-1">
        {(mark || eyebrow) && (
          <p className="flex items-center gap-1.5 font-mono text-xs text-link">
            {mark && (
              <span aria-hidden className="size-3.5 shrink-0 [&>svg]:size-full">
                {mark}
              </span>
            )}
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {(lead || detail) && (
          <div className="text-sm text-pretty text-muted-foreground">
            {lead}
            {lead && detail && " "}
            {detail}
          </div>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
