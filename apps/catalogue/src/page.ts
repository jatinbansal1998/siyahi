import type { ReactNode } from "react";

export interface PageSection {
  id: string;
  title: string;
  body: ReactNode;
}

export interface Page {
  id: string;
  title: string;
  /** The page's icon in the sidebar, all that shows when it collapses. */
  icon: ReactNode;
  lead: ReactNode;
  sections: PageSection[];
}
