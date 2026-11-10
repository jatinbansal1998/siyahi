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
      id: "section-cards",
      title: "SectionCards",
      lead: "The stat tile from shadcn's dashboard-01: muted label, outline badge top right, value, bold line, muted line.",
      imports: ["SectionCards", "type SectionCard"],
      props: [
        {
          name: "items",
          type: "SectionCard[]",
          purpose:
            "{ label, value, badge?, trend?, headline?, detail?, disabled?, tone? } per tile; badge is usually a Delta.",
        },
        {
          name: "selected",
          type: "string",
          default: "—",
          purpose: "The label of the picked tile, which takes a primary ring.",
        },
        {
          name: "onSelect",
          type: "(label: string) => void",
          default: "—",
          purpose: "Makes each tile a button that says whether it is pressed; keep tile content non-interactive.",
        },
        {
          name: "items[].trend",
          type: "ReactNode",
          default: "—",
          purpose: "A small chart between the figure and the footer lines, usually a Sparkline of the run behind it.",
        },
        {
          name: "items[].disabled",
          type: "boolean",
          default: "false",
          purpose:
            "In a picker, a tile that cannot be picked, such as a channel with no orders: faded, its button disabled.",
        },
        {
          name: "items[].tone",
          type: '"negative" | "warning"',
          default: "—",
          purpose: "Marks the tile as the exception on the page: a faint wash of the colour and an outline of it.",
        },
      ],
      rules: [
        "One tile per row on a phone. Wider, the columns follow the count so no tile sits alone under a full row: four run 2 then 4 across, three and six run 3 across, five runs 3 + 2 and then 5 in a row.",
        "A trend of gains or losses takes var(--positive) or var(--negative); any other run keeps --chart-1.",
        "A picked tile keeps its ring on every surface.",
        "The label and the footer lines are small monospaced capitals; the figure stays in the sans face.",
        "Set tone on the one or two tiles that need a look. The page decides: a falling figure is not an exception when it is a cost.",
      ],
      examples: [
        { name: "section-cards", caption: "Five headline figures, each with a Delta badge and two footer lines." },
        {
          name: "section-cards-select",
          caption: "Tiles as a picker of sales channels on a ruled surface; an empty channel is disabled.",
        },
        {
          name: "section-cards-trend",
          caption:
            "Each tile with a sparkline of its run, coloured by gain, loss or neither; the cash flow tile is marked negative.",
        },
      ],
    },
    {
      id: "metric-strip",
      title: "MetricStrip",
      lead: "dashboardcn's KPI row: one card holding a row of small figures, each with its change and recent run.",
      imports: ["MetricStrip", "type MetricStripItem"],
      props: [
        {
          name: "items",
          type: "MetricStripItem[]",
          purpose:
            "{ label, value, change?, changeFormat?, note?, trend? } per figure; change draws as a Delta and colours the trend.",
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
          name: "footer",
          type: "ReactNode",
          default: "—",
          purpose: "Lines under the strip, such as what the figures cover.",
        },
      ],
      rules: [
        "It fits two or three times the figures of SectionCards in the same room: use it where the page has many numbers of equal weight, and SectionCards where three or four headline figures each need a sentence.",
        "Rules part the tiles across and down; the columns follow the count, two to a row on a phone and up to eight on a wide card.",
      ],
      examples: [
        {
          name: "metric-strip",
          caption: "Six figures for October with their changes, sparklines and a period toggle.",
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
