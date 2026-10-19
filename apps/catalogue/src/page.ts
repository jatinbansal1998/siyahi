import type { ReactNode } from "react";

export interface PageSection {
  id: string;
  title: string;
  body: ReactNode;
}

export interface Page {
  id: string;
  title: string;
  lead: ReactNode;
  sections: PageSection[];
}
