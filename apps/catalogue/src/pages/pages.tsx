import { NewspaperIcon } from "lucide-react";
import type { Page } from "../page";

// A whole page draws every block at once, so this index links to each rather than drawing it: a live tile would mount
// a page in full to show its top, and a stacked page would mount all of them.
export const pages: Page = {
  id: "pages",
  title: "Pages",
  icon: <NewspaperIcon />,
  lead: "Whole app pages built only from the package, to read as a design: what leads, in what order, and how each block answers the one before it.",
  layout: "links",
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
    {
      id: "portfolio",
      title: "Portfolio",
      lead: "A whole page built from the package for one person's investments: one figure leads, and each section explains it a level deeper.",
      rules: [
        "The headline leads with the figure the page is about, set large and plain; every block below answers the question the one before it raises: what it is made of, how it got here, how it did against the market and what the falls cost, then every holding.",
        "Titles are worked out from the data, so the page states its findings and never goes stale.",
        "Charts over the same days share a syncId and sit one under the other, so a hover reads the return and the fall from its best on one day.",
        "On a phone the blocks stack in reading order and the table keeps the holding and its worth, with the day's change folded under it and the rest a tap away.",
      ],
      examples: [
        {
          name: "portfolio-page",
          caption:
            "Fifteen made-up holdings in five asset classes on 27 Nov 2026: worth, the day, the gain since April against the Nifty 50, the worst fall and every holding.",
        },
      ],
    },
    {
      id: "instrument",
      title: "Instrument",
      lead: "Everything about one share on one page, built from the package as it ships: the price and the day's move head it, a large annotated chart leads, and each block after it answers the next question a reader of the chart asks.",
      rules: [
        "The price is the page's title and the chart its first block: on a phone the chart keeps a 360px floor, so it stays the main block rather than a strip, and its axis is in whole rupees while its legend keeps the paise.",
        "Each block answers what a reader of the chart asks next, in order: where the price sits in its year, whether today was a big day, whether it beat the market, how its months go, and how far it has fallen and why.",
        "Every figure is worked out from the sessions, so the titles state findings and the falls table names the news inside each fall.",
        "On a phone the blocks stack in reading order and the falls table keeps the fall and its cause, with the dates a tap away.",
      ],
      examples: [
        {
          name: "instrument-page",
          caption:
            "A made-up NSE share over five years against the Nifty 50; every figure is worked out from its sessions.",
        },
      ],
    },
  ],
};
