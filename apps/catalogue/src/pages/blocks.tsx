import { BlocksIcon } from "lucide-react";
import { Code } from "../code";
import { Example, Lead } from "../example";
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
  sections: [
    {
      id: "section-cards",
      title: "SectionCards",
      body: (
        <>
          <Lead>
            The stat tile, from shadcn's dashboard-01: muted label, outline badge top right, value, bold line, muted
            line. One tile per row on a phone. Wider, the columns follow the count so no tile sits alone under a full
            row: four run 2 then 4 across, three and six run 3 across, five runs 3 + 2 and then 5 in a row.
          </Lead>
          <Example name="section-cards" />
          <Lead>
            With selected and onSelect the tiles become a picker, such as one tile per asset class that scopes the page:
            each tile is a button that says whether it is pressed, and the picked one takes a primary ring. A tile with
            disabled set, such as a class with no positions, fades and cannot be picked.
          </Lead>
          <Example name="section-cards-select" />
          <Lead>
            trend puts a small chart between the figure and the footer lines, usually a Sparkline of the run behind the
            value. A run of gains or losses takes var(--positive) or var(--negative); any other run keeps --chart-1.
          </Lead>
          <Example name="section-cards-trend" />
        </>
      ),
    },
    {
      id: "metric-strip",
      title: "MetricStrip",
      body: (
        <>
          <Lead>
            dashboardcn's KPI row: one card holding a row of small figures, each with its change as a Delta and its
            recent run as a sparkline that takes the change's colour. It fits two or three times the figures of
            SectionCards in the same room, so use it where the page has many numbers of equal weight and SectionCards
            where three or four headline figures each need a sentence. Rules part the tiles across and down; the columns
            follow the count, two to a row on a phone, and up to eight in a row on a wide card. The title is optional,
            for a strip heading a page; a period toggle goes in action, as on the chart cards.
          </Lead>
          <Example name="metric-strip" />
        </>
      ),
    },
    {
      id: "sidebar",
      title: "AppSidebar",
      body: (
        <>
          <Lead>
            shadcn's sidebar-07 block. This catalogue's own navigation is the live example: it collapses to icons with
            the button in the header and becomes a drawer under 768px. The code below is this catalogue's shell.
          </Lead>
          <Code>{shellSource ?? ""}</Code>
        </>
      ),
    },
    {
      id: "sidebar-links",
      title: "AppSidebar with flat links",
      body: (
        <>
          <Lead>
            An item with sub-items is a collapsible group, as in this catalogue's navigation. An item without them is a
            plain link, marked by isActive and named in a tooltip when the sidebar is collapsed to icons: an app of flat
            views passes only title, url, icon and isActive. linkProps go onto that link's anchor, for a new tab or for
            hover handlers that prefetch the view's data. On a phone, following any link closes the drawer.
          </Lead>
          <Example name="app-sidebar" />
        </>
      ),
    },
  ],
};
