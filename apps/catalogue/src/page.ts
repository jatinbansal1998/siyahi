import type { ReactNode } from "react";

/** One row of a family's Props table. */
export interface PropRow {
  name: string;
  type: string;
  default?: string;
  purpose: string;
}

/** A live example: `examples/<name>.tsx` with a line saying what it shows. */
export interface ExampleSpec {
  name: string;
  caption: string;
}

/** One component family, or one part of a reference page: its `#/<page>/<id>` route shows it alone. */
export interface Family {
  id: string;
  title: string;
  /** One sentence: what it is and when to reach for it. */
  lead: ReactNode;
  /** Names exported from @siyahi/ui, written as the family's import line. */
  imports?: string[];
  props?: PropRow[];
  /** What the props table cannot say: when to use it, and what to pair it with. */
  rules?: string[];
  examples?: ExampleSpec[];
  /** Content that is not a live example, such as swatches or a code sample. */
  body?: ReactNode;
}

export interface Page {
  id: string;
  title: string;
  /** The page's icon in the sidebar, all that shows when it collapses. */
  icon: ReactNode;
  lead: ReactNode;
  /** Drawn in place of the title and lead: a front page's PageHero. */
  hero?: ReactNode;
  /**
   * "index" lists the families as cards, each opening on its own route; "stack" draws them all in one page, for
   * reference pages whose parts are short.
   */
  layout: "index" | "stack";
  families: Family[];
}
