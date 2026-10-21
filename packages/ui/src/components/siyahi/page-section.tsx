import type { ReactNode } from "react";

export interface PageSectionProps {
  /** Anchor for a table of contents; the section scrolls in with room above it. */
  id?: string;
  /** Small muted line above the title, such as "Part 2". */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Muted prose under the title: a sentence, or several paragraphs as elements. */
  lead?: ReactNode;
  /** A control for the whole section, such as a copy or mode toggle; it sits right, beside the heading. */
  action?: ReactNode;
  children?: ReactNode;
}

/** One part of a long page: a rule above, then the heading and lead on the canvas, then its content. */
export function PageSection({ id, eyebrow, title, lead, action, children }: PageSectionProps) {
  return (
    <section id={id} data-slot="page-section" className="flex scroll-mt-6 flex-col gap-6 border-t pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {lead && <div className="flex max-w-prose flex-col gap-2 text-muted-foreground">{lead}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A heading inside a PageSection, one level under its title. */
export function PageSubheading({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold tracking-tight">{children}</h3>;
}
