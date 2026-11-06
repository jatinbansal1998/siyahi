import { LayersIcon, SlidersHorizontalIcon } from "lucide-react";
import type { Family, Page, PropRow } from "../page";

interface Entry extends Omit<Family, "examples"> {
  /** What its one example, `examples/<id>.tsx`, shows. */
  caption: string;
  compact?: boolean;
}

// Most parts have one example named after the part itself.
function familiesOf(entries: Entry[]): Family[] {
  return entries.map(({ caption, compact, ...family }) => ({
    ...family,
    examples: [{ name: family.id, caption, compact }],
  }));
}

const VARIANT = (values: string, purpose: string, fallback = '"default"'): PropRow => ({
  name: "variant",
  type: values,
  default: fallback,
  purpose,
});

const display: Entry[] = [
  {
    id: "button",
    title: "Button",
    lead: "An action: primary for the one the reader came to take, outline with an icon for the rest.",
    imports: ["Button"],
    props: [
      VARIANT(
        '"default" | "outline" | "secondary" | "ghost" | "destructive" | "link"',
        "default is black on white (white on black in dark), one per view; link is shadcn's underlined --primary text.",
      ),
      {
        name: "size",
        type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"',
        default: '"default"',
        purpose: "Height and padding.",
      },
    ],
    rules: ['A link in prose is <a className="text-link">, not variant="link".'],
    caption: "Primary Save, outline Export with its icon, the other variants and an icon-only button.",
    compact: true,
  },
  {
    id: "badge",
    title: "Badge",
    lead: "A short label beside a name or a figure, neutral by default.",
    imports: ["Badge"],
    props: [
      VARIANT(
        '"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"',
        "outline for categories and signed figures.",
      ),
    ],
    rules: [
      "Categories stay neutral: a broker, a sector or an asset class is an outline badge, never a colour.",
      "A signed figure goes in an outline badge too, as a Delta.",
    ],
    caption: "Each variant, with a broker and signed figures in outline badges.",
    compact: true,
  },
  {
    id: "card",
    title: "Card",
    lead: "A card holds data; prose sits on the page around it.",
    imports: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardAction", "CardContent", "CardFooter"],
    props: [
      { name: "size", type: '"default" | "sm"', default: '"default"', purpose: "Padding: 16px, or 12px for sm." },
    ],
    rules: ["One level only: no card inside a card."],
    caption: "A portfolio value with its description, an action and a footer.",
  },
  {
    id: "code-block",
    title: "Code block",
    lead: "A command or a file to read or paste, in Geist Mono on the muted fill.",
    imports: [
      "CodeBlock",
      "CodeBlockHeader",
      "CodeBlockTitle",
      "CodeBlockActions",
      "CodeBlockCopyButton",
      "CodeBlockContent",
    ],
    props: [
      { name: "CodeBlock size", type: '"default" | "sm"', default: '"default"', purpose: "Text and padding size." },
      {
        name: "CodeBlockContent wrap",
        type: "boolean",
        default: "false",
        purpose: "Breaks long lines instead of scrolling sideways, for a command the reader should see whole.",
      },
    ],
    rules: [
      "A copy button goes in CodeBlockActions: in a CodeBlockHeader beside a title, or on its own, where it shows on hover (always on a touch screen).",
      "A max-h class on CodeBlockContent makes a long log scroll inside the block.",
    ],
    caption: "A titled, wrapped command with its copy button, and a small log that scrolls inside the block.",
  },
  {
    id: "copy-button",
    title: "Copy button",
    lead: "MiniDev's copy button: an outline button with a label, for copying more than one block at once.",
    imports: ["CopyButton"],
    props: [
      { name: "value", type: "string", purpose: "The text copied." },
      { name: "label", type: "string", default: '"Copy"', purpose: "The button's words." },
    ],
    rules: [
      "It reads Copied with a check for 2 s.",
      "Inside a code block, use CodeBlockCopyButton, which is icon-only.",
    ],
    caption: "Copy all of a setup page's commands at once.",
    compact: true,
  },
  {
    id: "alert",
    title: "Alert",
    lead: "A notice: default for information, destructive for errors, default with an amber icon for warnings.",
    imports: ["Alert", "AlertTitle", "AlertDescription"],
    props: [VARIANT('"default" | "destructive"', "destructive for errors; information and warnings use default.")],
    rules: [
      "A warning's icon takes text-warning! with the !: Alert colours its icons through a selector that outranks a plain text-warning.",
    ],
    caption: "Information, a warning with its amber icon, and an error.",
  },
  {
    id: "tabs",
    title: "Tabs",
    lead: "Views switch with tabs.",
    imports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
    caption: "Holdings, Realized and Cash flow as three views.",
    compact: true,
  },
  {
    id: "progress",
    title: "Progress",
    lead: "A long import or upload.",
    imports: ["Progress", "ProgressLabel", "ProgressValue"],
    caption: "Statements imported, part way through, with its label and value.",
    compact: true,
  },
  {
    id: "progress-tone",
    title: "ToneProgress",
    lead: "Progress with its bar in a meaning colour, such as each position's share of the booked P&L.",
    imports: ["ToneProgress"],
    props: [
      {
        name: "tone",
        type: '"positive" | "negative"',
        purpose: "positive for a gain's share, negative for a loss's; takes every Progress prop besides.",
      },
    ],
    rules: ["Write the figure beside the bar; the colour is never the only cue."],
    caption: "Each position's share of the booked P&L, gains and losses, with the figure beside each bar.",
    compact: true,
  },
  {
    id: "skeleton",
    title: "Skeleton",
    lead: "The shape of content that is still loading.",
    imports: ["Skeleton"],
    caption: "A label, a figure and a line of text still loading.",
    compact: true,
  },
  {
    id: "separator",
    title: "Separator",
    lead: "A thin rule between items.",
    imports: ["Separator"],
    caption: "Asset classes parted by rules.",
    compact: true,
  },
  {
    id: "breadcrumb",
    title: "Breadcrumb",
    lead: "Where the page sits.",
    imports: [
      "Breadcrumb",
      "BreadcrumbList",
      "BreadcrumbItem",
      "BreadcrumbLink",
      "BreadcrumbPage",
      "BreadcrumbSeparator",
    ],
    caption: "Portfolio, Equity, then INFY as the current page.",
    compact: true,
  },
  {
    id: "scroll-area",
    title: "Scroll area",
    lead: "A fixed-height box that scrolls on its own.",
    imports: ["ScrollArea"],
    caption: "A list of months taller than its box.",
    compact: true,
  },
  {
    id: "avatar",
    title: "Avatar",
    lead: "A person or an account, by initials.",
    imports: ["Avatar", "AvatarFallback"],
    caption: "Two accounts by their initials.",
    compact: true,
  },
  {
    id: "collapsible",
    title: "Collapsible",
    lead: "Detail that stays out of the way until asked for.",
    imports: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"],
    caption: "How lots are matched, shown on request.",
    compact: true,
  },
  {
    id: "accordion",
    title: "Accordion",
    lead: "A list of questions, such as an FAQ, in one bordered group.",
    imports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],
    props: [
      {
        name: "multiple",
        type: "boolean",
        default: "false",
        purpose: "Lets several items stay open; by default opening one closes the other.",
      },
    ],
    caption: "One open at a time beside multiple, several open.",
  },
  {
    id: "table",
    title: "Table",
    lead: "The plain table, for small fixed lists.",
    imports: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"],
    rules: ["Anything to sort or filter uses the data table."],
    caption: "A month-by-month cash flow in a card.",
  },
];

const controls: Entry[] = [
  {
    id: "toggle-group",
    title: "Toggle group",
    lead: "Range and mode toggles, top right of a chart's card.",
    imports: ["ToggleGroup", "ToggleGroupItem"],
    caption: "A range toggle with 1Y pressed.",
    compact: true,
  },
  {
    id: "toggle",
    title: "Toggle",
    lead: "A single on or off control.",
    imports: ["Toggle"],
    caption: "Hide amounts, an outline toggle with its icon.",
    compact: true,
  },
  {
    id: "select",
    title: "Select",
    lead: "Pick one option from a short list.",
    imports: ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectGroup", "SelectItem"],
    caption: "Pick one account from a short list.",
    compact: true,
  },
  {
    id: "input",
    title: "Input and textarea",
    lead: "Text entry, with an icon in an input group when the field needs one.",
    imports: ["Input", "InputGroup", "InputGroupAddon", "InputGroupInput", "Textarea"],
    caption: "A plain input, a search input with its icon, and a textarea.",
    compact: true,
  },
  {
    id: "slider",
    title: "Slider",
    lead: "A value or a range on a track.",
    imports: ["Slider"],
    caption: "An allocation band as a range in steps of 5.",
    compact: true,
  },
  {
    id: "calendar",
    title: "Calendar",
    lead: "Date picking, on react-day-picker.",
    imports: ["Calendar"],
    caption: "October 2026 with the 20th picked.",
    compact: true,
  },
  {
    id: "tooltip",
    title: "Tooltip",
    lead: "A short label on hover or focus.",
    imports: ["Tooltip", "TooltipTrigger", "TooltipContent"],
    rules: ["SiyahiProvider already includes the tooltip provider."],
    caption: "XIRR explained on hovering an info button.",
    compact: true,
  },
  {
    id: "popover",
    title: "Popover",
    lead: "A short explanation or a small form, anchored to its trigger.",
    imports: ["Popover", "PopoverTrigger", "PopoverContent", "PopoverHeader", "PopoverTitle", "PopoverDescription"],
    caption: "How a price is set, opened from a button.",
    compact: true,
  },
  {
    id: "dialog",
    title: "Dialog",
    lead: "A focused task over the page.",
    imports: [
      "Dialog",
      "DialogTrigger",
      "DialogContent",
      "DialogHeader",
      "DialogTitle",
      "DialogDescription",
      "DialogFooter",
      "DialogClose",
    ],
    caption: "A sell's fills over the page, closed from its footer.",
    compact: true,
  },
  {
    id: "sheet",
    title: "Sheet",
    lead: "A side panel, such as filters on a phone.",
    imports: ["Sheet", "SheetTrigger", "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription"],
    caption: "Ledger filters in a side panel.",
    compact: true,
  },
  {
    id: "dropdown-menu",
    title: "Dropdown menu",
    lead: "Actions on a row or a card.",
    imports: [
      "DropdownMenu",
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "DropdownMenuGroup",
      "DropdownMenuItem",
      "DropdownMenuLabel",
      "DropdownMenuSeparator",
    ],
    caption: "A holding's actions in a menu, a destructive one among them.",
    compact: true,
  },
  {
    id: "context-menu",
    title: "Context menu",
    lead: "The same actions on right-click or long-press.",
    imports: ["ContextMenu", "ContextMenuTrigger", "ContextMenuContent", "ContextMenuItem"],
    caption: "Copy symbol and Open chart on right-click.",
    compact: true,
  },
  {
    id: "command",
    title: "Command",
    lead: "Search and jump; in a dialog it becomes the ⌘K palette.",
    imports: ["Command", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem"],
    caption: "Jump to a page by typing its name.",
  },
];

export const components: Page = {
  id: "components",
  title: "Components",
  icon: <LayersIcon />,
  lead: "shadcn/ui on Base UI in the base-nova style, installed with the shadcn CLI and never edited. Each one is shown live with its code.",
  layout: "index",
  families: familiesOf(display),
};

export const inputs: Page = {
  id: "inputs",
  title: "Inputs and overlays",
  icon: <SlidersHorizontalIcon />,
  lead: "Controls, menus and layers from shadcn/ui on Base UI, as installed.",
  layout: "index",
  families: familiesOf(controls),
};
