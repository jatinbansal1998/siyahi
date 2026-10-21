import { Example, Lead } from "../example";
import type { Page } from "../page";

export const layout: Page = {
  id: "layout",
  title: "Page layout",
  lead: "The parts of a long page that are not data: its sections, headings, facts and code in prose. Siyahi's own, each a few lines.",
  sections: [
    {
      id: "page-section",
      title: "PageSection, DataList, InlineCode",
      body: (
        <>
          <Lead>
            PageSection is one part of a long page: a rule above, an optional eyebrow such as Part 2, the h2 title, a
            muted lead and an optional action on the right, then its content. Give it an id for a table of contents.
            PageSubheading is the h3 inside it. DataList holds label and value pairs, such as a record's fields in a
            card; a label may carry a badge. InlineCode marks a command, file or identifier in prose.
          </Lead>
          <Example name="page-section" />
        </>
      ),
    },
  ],
};
