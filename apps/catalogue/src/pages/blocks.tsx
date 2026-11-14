import { BlocksIcon } from "lucide-react";
import { Code } from "../code";
import type { Page } from "../page";

// Read through a glob rather than an import, so the shell's source is not a module dependency of this page.
const shellSource = Object.values(
  import.meta.glob<string>("../shell.tsx", { eager: true, query: "?raw", import: "default" }),
)[0];

export const blocks: Page = {
  id: "blocks",
  title: "Blocks",
  icon: <BlocksIcon />,
  lead: "shadcn blocks with their sample data taken out, so an app passes its own.",
  layout: "index",
  families: [
    {
      id: "metric-strip",
      title: "MetricStrip",
      lead: "A row of figures, each with its label, change and recent run, and optionally a picker that scopes the page. From dashboardcn's KPI row.",
      imports: ["MetricStrip", "type MetricStripItem"],
      props: [
        {
          name: "items",
          type: "MetricStripItem[]",
          purpose:
            "{ label, value, change?, changeFormat?, note?, trend?, tone?, stale?, disabled? } per figure; change draws as a Delta and colours the trend.",
        },
        { name: "title", type: "ReactNode", default: "—", purpose: "Optional, for a strip heading a page." },
        { name: "description", type: "ReactNode", default: "—", purpose: "A muted line under the title." },
        {
          name: "action",
          type: "ReactNode",
          default: "—",
          purpose: "A period toggle, top right, as on the chart cards.",
        },
        {
          name: "variant",
          type: '"strip" | "blocks"',
          default: '"strip"',
          purpose:
            "blocks sets two to four figures as the page's headline, each on a solid block; no sparkline, no tone.",
        },
        {
          name: "footer",
          type: "ReactNode",
          default: "—",
          purpose: "Lines under the strip, such as what the figures cover.",
        },
        {
          name: "selected",
          type: "string",
          default: "—",
          purpose: "The label of the picked figure, which takes an outline.",
        },
        {
          name: "onSelect",
          type: "(label: string) => void",
          default: "—",
          purpose: "Makes each figure a button that says whether it is pressed; keep figure content non-interactive.",
        },
        {
          name: "items[].tone",
          type: '"negative" | "warning"',
          default: "—",
          purpose: "Marks the figure as the exception on the page: a faint wash of the colour and an outline of it.",
        },
        {
          name: "items[].stale",
          type: "ReactNode",
          default: "—",
          purpose: 'Since when the figure\'s data is old, such as "3 Nov": the figure greys and says so.',
        },
        {
          name: "items[].disabled",
          type: "boolean",
          default: "false",
          purpose:
            "In a picker, a figure that cannot be picked, such as a channel with no orders: faded, its button disabled.",
        },
      ],
      rules: [
        "No box and no rules: space parts the figures, and each figure's text lines up with its neighbours' and the title's.",
        "The columns follow the count, so no figure sits alone under a full row, up to eight of them: five run 3 + 2, seven 4 + 3, and eight fit one row on a wide strip.",
        "A sparkline sits under its figure at the figure's width; a run of gains or losses takes var(--positive) or var(--negative) from the change's sign.",
        "Set tone on the one or two figures that need a look. The page decides: a falling figure is not an exception when it is a cost.",
        "variant=\"blocks\" is the page's headline, one per page, at its top: the figures sit on solid blocks, orange, then the text colour, then a grey, touching, each value large and in the block's own ink. It draws no sparkline and no tone; mark an exception in a strip below it.",
      ],
      examples: [
        {
          name: "metric-strip",
          caption:
            "Six figures for October with their changes, sparklines and a period toggle; the cash flow is marked negative.",
        },
        {
          name: "metric-strip-trend",
          caption: "Three headline figures with the run behind each; the cash flow is marked negative.",
        },
        {
          name: "metric-strip-headline",
          caption: "Three headline figures on solid blocks, for the top of a page.",
        },
        {
          name: "metric-strip-select",
          caption: "Figures as a picker of sales channels; an empty channel is disabled.",
        },
      ],
    },
    {
      id: "sidebar",
      title: "AppSidebar",
      lead: "shadcn's sidebar-07 block; this catalogue's own navigation is the live example.",
      imports: ["AppSidebar", "SidebarProvider", "SidebarInset", "SidebarTrigger", "defaultSidebarOpen"],
      props: [
        {
          name: "navMain",
          type: "{ title, url, icon, isActive?, linkProps?, items? }[]",
          purpose: "The views; an item with items is a collapsible group of sub-links.",
        },
        { name: "navLabel", type: "string", default: '"Navigation"', purpose: "The group's label." },
        {
          name: "header",
          type: "ReactNode",
          default: "team switcher",
          purpose: "Shown at the top instead of the team switcher.",
        },
        { name: "collapsible", type: '"icon" | "offcanvas" | "none"', default: '"icon"', purpose: "How it collapses." },
      ],
      rules: [
        "It collapses to icons with the button in the header and becomes a drawer under 768px.",
        "The code below is this catalogue's shell.",
      ],
      body: <Code>{shellSource ?? ""}</Code>,
    },
    {
      id: "sidebar-links",
      title: "Flat sidebar links",
      lead: "An AppSidebar item without sub-items is a plain link, for an app of flat views.",
      imports: ["AppSidebar", "SidebarProvider"],
      props: [
        {
          name: "title, url, icon",
          type: "string, string, ReactNode",
          purpose: "All a flat view passes, with isActive.",
        },
        {
          name: "isActive",
          type: "boolean",
          default: "false",
          purpose: 'Marks the open view, with aria-current="page".',
        },
        {
          name: "linkProps",
          type: 'Omit<ComponentProps<"a">, "href">',
          default: "—",
          purpose: "Go onto the link's anchor, for a new tab or hover handlers that prefetch the view's data.",
        },
      ],
      rules: [
        "Collapsed to icons, each link is named in a tooltip.",
        "On a phone, following any link closes the drawer.",
      ],
      examples: [{ name: "app-sidebar", caption: 'Flat views drawn in place with collapsible="none".' }],
    },
  ],
};
