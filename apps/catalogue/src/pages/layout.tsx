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
      id: "page-hero",
      title: "Page hero",
      lead: "PageHero introduces a front page or a long explainer: a large title, what the page is, and where to go next.",
      imports: ["PageHero"],
      props: [
        { name: "title", type: "ReactNode", purpose: "The page's h1, set large." },
        {
          name: "eyebrow",
          type: "ReactNode",
          default: "—",
          purpose: "A short line above the title in the link colour.",
        },
        { name: "lead", type: "ReactNode", default: "—", purpose: "What the page is, in a sentence or two." },
        { name: "detail", type: "ReactNode", default: "—", purpose: "Muted detail under the lead: scope, sources." },
        {
          name: "actions",
          type: "ReactNode",
          default: "—",
          purpose: "The one or two places a reader goes next: a primary Button and an outline one.",
        },
        {
          name: "mark",
          type: "ReactNode",
          default: "—",
          purpose:
            "A large decorative mark drawn faintly in the accent, such as a logo SVG that paints with currentColor.",
        },
      ],
      rules: [
        "One per page, above everything else; the parts below it are PageSections.",
        "A dashboard view opens on its answer, not a hero: the hero is for front pages and explainers.",
        "At most one primary action.",
      ],
      examples: [
        {
          name: "page-hero",
          caption: "The catalogue's own front page: eyebrow, title, lead, detail, two actions and its ink drop.",
        },
      ],
    },
    {
      id: "callout",
      title: "Callouts and quotes",
      lead: "Callout sets a point apart from the prose, tinted whole in its tone; Quote sets a quotation on a muted panel.",
      imports: ["Callout", "Quote", "WarningAlert"],
      props: [
        {
          name: "Callout tone",
          type: '"neutral" | "accent" | "warning" | "positive" | "negative"',
          default: '"neutral"',
          purpose:
            "neutral for an aside, accent for a key point, warning for a caution, positive or negative for a gain or a loss.",
        },
        {
          name: "Callout icon",
          type: "ReactNode",
          default: "—",
          purpose: "A lucide icon, drawn in the tone's colour.",
        },
        { name: "Callout title", type: "ReactNode", default: "—", purpose: "A bold first line." },
        {
          name: "Quote source",
          type: "ReactNode",
          default: "—",
          purpose: "Who said it, or where it is from, under the quote.",
        },
      ],
      rules: [
        "Never mark a notice, card, row or quote with one coloured edge (a side stripe): tint the whole box, as these do.",
        "A notice that interrupts is Alert, or WarningAlert for a caution; a Callout is content the reader reads in order.",
        "One accent Callout per section at most; warning only for a real caution.",
      ],
      examples: [{ name: "callout", caption: "Every tone, a quotation with its source, and a WarningAlert." }],
    },
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
