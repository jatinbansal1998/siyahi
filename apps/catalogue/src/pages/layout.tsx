import { LayoutTemplateIcon } from "lucide-react";
import type { Page } from "../page";

export const layout: Page = {
  id: "layout",
  title: "Page layout",
  icon: <LayoutTemplateIcon />,
  lead: "The parts of a long page that are not data: its sections, headings, facts and code in prose. Siyahi's own, each a few lines.",
  layout: "stack",
  families: [
    {
      id: "page-section",
      title: "Sections and facts",
      lead: "PageSection is one part of a long page; DataList holds its facts and InlineCode its identifiers.",
      imports: ["PageSection", "PageSubheading", "DataList", "DataListItem", "InlineCode"],
      props: [
        { name: "PageSection title", type: "ReactNode", purpose: "The section's h2." },
        {
          name: "PageSection id",
          type: "string",
          default: "—",
          purpose: "Anchor for a table of contents; it scrolls in with room above.",
        },
        {
          name: "PageSection eyebrow",
          type: "ReactNode",
          default: "—",
          purpose: "A small muted line above the title, such as Part 2.",
        },
        {
          name: "PageSection lead",
          type: "ReactNode",
          default: "—",
          purpose: "Muted prose under the title: a sentence, or several paragraphs as elements.",
        },
        {
          name: "PageSection action",
          type: "ReactNode",
          default: "—",
          purpose: "A control for the whole section, on the right beside the heading.",
        },
        { name: "DataListItem label", type: "ReactNode", purpose: "A short muted label; it may carry a badge." },
      ],
      rules: [
        "A PageSection draws a rule above, then its eyebrow, title, lead and action, then its content.",
        "PageSubheading is the h3 inside a PageSection.",
        "DataList holds label and value pairs, such as a record's fields in a card.",
        "InlineCode marks a command, file or identifier in prose.",
      ],
      examples: [
        {
          name: "page-section",
          caption: "A section with an eyebrow, lead and action, a subheading, a fact list and inline code.",
        },
      ],
    },
  ],
};
