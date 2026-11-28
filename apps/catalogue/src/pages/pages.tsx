import { NewspaperIcon } from "lucide-react";
import type { Page } from "../page";

// Whole pages draw every block at once, so they get a page of their own: as a tile on an index page each would mount
// in full only to show its top.
export const pages: Page = {
  id: "pages",
  title: "Pages",
  icon: <NewspaperIcon />,
  lead: "Whole app pages built only from the package, to read as a design: what leads, in what order, and how each block answers the one before it.",
  layout: "stack",
  families: [
    {
      id: "market-close",
      title: "Market close",
      lead: "The Indian market after the close: one sentence says what kind of day it was, the indices say where they ended and when the day turned, and each section then asks a question its blocks answer.",
      rules: [
        "The design is in the order and the scale, not in decoration: the finding as the page title, the indices as a row of small multiples, one wide chart for when the day turned, then sections that each ask a question and pairs of blocks whose titles answer it.",
        "Small multiples share a scale: every breadth row is the same bar with the same half-way tick, and every sector cell tints to the same 3%, so the eye compares down the column.",
        "On a phone the blocks keep this order; the stock table keeps its key columns and opens a row on the rest.",
      ],
      examples: [
        {
          name: "market-day",
          caption: "Friday 27 Nov 2026 on the NSE, with made-up figures: the Nifty fell while most stocks rose.",
        },
      ],
    },
  ],
};
