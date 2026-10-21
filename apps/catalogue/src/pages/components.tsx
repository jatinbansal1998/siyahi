import { Example, Lead } from "../example";
import type { Page, PageSection } from "../page";

type Entry = [id: string, title: string, lead: string];

function sectionsOf(entries: Entry[]): PageSection[] {
  return entries.map(([id, title, lead]) => ({
    id,
    title,
    body: (
      <>
        <Lead>{lead}</Lead>
        <Example name={id} />
      </>
    ),
  }));
}

const display: Entry[] = [
  [
    "button",
    "Button",
    'Primary is black on white and white on black. Secondary actions are outline buttons with an icon. variant="link" is shadcn\'s underlined --primary text, not the --link meaning colour; a real link is <a className="text-link">.',
  ],
  [
    "badge",
    "Badge",
    "Categories stay neutral: a broker, a sector or an asset class is an outline badge, never a colour. A signed figure goes in an outline badge too.",
  ],
  ["card", "Card", "A card holds data. One level only; prose sits on the page around it."],
  [
    "alert",
    "Alert",
    "Default for information, destructive for errors, default with an amber icon for warnings. The icon takes text-warning! with the !: Alert colours its icons through a selector that outranks a plain text-warning.",
  ],
  ["tabs", "Tabs", "Views switch with tabs."],
  ["progress", "Progress", "A long import or upload."],
  ["skeleton", "Skeleton", "The shape of content that is still loading."],
  ["separator", "Separator", "A thin rule between items."],
  ["breadcrumb", "Breadcrumb", "Where the page sits."],
  ["scroll-area", "Scroll area", "A fixed-height box that scrolls on its own."],
  ["avatar", "Avatar", "A person or an account, by initials."],
  ["collapsible", "Collapsible", "Detail that stays out of the way until asked for."],
  [
    "accordion",
    "Accordion",
    "A list of questions, such as an FAQ, in one bordered group. One item open at a time by default; multiple lets several stay open.",
  ],
  ["table", "Table", "The plain table, for small fixed lists. Anything to sort or filter uses the data table."],
];

const controls: Entry[] = [
  ["toggle-group", "Toggle group", "Range and mode toggles, top right of a chart's card."],
  ["toggle", "Toggle", "A single on or off control."],
  ["select", "Select", "Pick one option from a short list."],
  ["input", "Input, input group, textarea", "Text entry, with an icon when the field needs one."],
  ["slider", "Slider", "A value or a range on a track."],
  ["calendar", "Calendar", "Date picking, on react-day-picker."],
  ["tooltip", "Tooltip", "SiyahiProvider already includes the tooltip provider."],
  ["popover", "Popover", "A short explanation or a small form, anchored to its trigger."],
  ["dialog", "Dialog", "A focused task over the page."],
  ["sheet", "Sheet", "A side panel, such as filters on a phone."],
  ["dropdown-menu", "Dropdown menu", "Actions on a row or a card."],
  ["context-menu", "Context menu", "The same actions on right-click or long-press."],
  ["command", "Command", "Search and jump; in a dialog it becomes the ⌘K palette."],
];

export const components: Page = {
  id: "components",
  title: "Components",
  lead: "shadcn/ui on Base UI in the base-luma style, installed with the shadcn CLI and never edited. Each one is shown live with its code.",
  sections: sectionsOf(display),
};

export const inputs: Page = {
  id: "inputs",
  title: "Inputs and overlays",
  lead: "Controls, menus and layers from shadcn/ui on Base UI, as installed.",
  sections: sectionsOf(controls),
};
