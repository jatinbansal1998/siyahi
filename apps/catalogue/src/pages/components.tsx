import { LayersIcon, SlidersHorizontalIcon } from "lucide-react";
import type { ExampleSpec, Family, Page, PropRow } from "../page";

interface Entry extends Omit<Family, "examples"> {
  /** What its main example, `examples/<id>.tsx`, shows. */
  caption: string;
  /** Examples after the main one, such as its states. */
  more?: ExampleSpec[];
}

// Most parts lead with one example named after the part itself.
function familiesOf(entries: Entry[]): Family[] {
  return entries.map(({ caption, more = [], ...family }) => ({
    ...family,
    examples: [{ name: family.id, caption }, ...more],
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
    more: [{ name: "button-states", caption: "Disabled, busy with a spinner, and pressed, as a toggle shows it." }],
  },
  {
    id: "badge",
    title: "Badge",
    lead: "A short label beside a name or a figure: StatusBadge for a state, an outline Badge for a category.",
    imports: ["Badge", "StatusBadge"],
    props: [
      VARIANT(
        '"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"',
        "outline for categories and signed figures.",
      ),
      {
        name: "StatusBadge tone",
        type: '"neutral" | "accent" | "warning" | "positive" | "negative"',
        default: '"neutral"',
        purpose:
          "positive for paid or done, warning for pending, negative for failed, accent for new, neutral for a draft.",
      },
    ],
    rules: [
      "Categories stay neutral: a team, a region or a product line is an outline badge, never a colour.",
      "A state (paid, pending, failed) is a StatusBadge: its tone's wash with a dot in the tone's colour; the label stays in the text colour so it reads.",
      "A signed figure goes in an outline badge too, as a Delta.",
    ],
    caption: "States as StatusBadges, then the stock variants with a team and signed figures in outline badges.",
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
    caption: "A quarter's revenue with its description, an action and a footer.",
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
  },
  {
    id: "alert",
    title: "Alert",
    lead: "A notice is a StatusAlert in its tone: neutral for information, warning for a caution, negative for an error, positive for a success.",
    imports: ["StatusAlert", "AlertTitle", "AlertDescription"],
    props: [
      {
        name: "tone",
        type: '"neutral" | "accent" | "warning" | "positive" | "negative"',
        default: '"neutral"',
        purpose: "Sets the wash, the border and the icon; title and description stay in the text colours.",
      },
    ],
    rules: [
      "Every tone tints the whole card: a faint wash inside a border of the same colour, with its icon. An error reads like a warning, only red.",
      "Never mark a notice, card or row with one coloured edge (a left border stripe); tint the whole box or use the icon.",
    ],
    caption: "Information, a warning, an error and a success, each tinted across the card.",
  },
  {
    id: "tabs",
    title: "Tabs",
    lead: "Views switch with tabs.",
    imports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
    caption: "Orders, Returns and Payouts as three views.",
  },
  {
    id: "progress",
    title: "Progress",
    lead: "A long import or upload.",
    imports: ["Progress", "ProgressLabel", "ProgressValue"],
    caption: "Orders imported, part way through, with its label and value.",
  },
  {
    id: "progress-tone",
    title: "ToneProgress",
    lead: "Progress with its bar in a meaning colour, such as each channel's share of a quarter's profit and loss.",
    imports: ["ToneProgress"],
    props: [
      {
        name: "tone",
        type: '"positive" | "negative"',
        purpose: "positive for a gain's share, negative for a loss's; takes every Progress prop besides.",
      },
    ],
    rules: ["Write the figure beside the bar; the colour is never the only cue."],
    caption:
      "Each channel's share of the quarter's profit and loss, gains and losses, with the figure beside each bar.",
  },
  {
    id: "skeleton",
    title: "Skeleton",
    lead: "The shape of content that is still loading.",
    imports: ["Skeleton"],
    caption: "A label, a figure and a line of text still loading.",
  },
  {
    id: "separator",
    title: "Separator",
    lead: "A thin rule between items.",
    imports: ["Separator"],
    caption: "Three views parted by rules.",
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
    caption: "Projects, Website, then Checkout redesign as the current page.",
  },
  {
    id: "scroll-area",
    title: "Scroll area",
    lead: "A fixed-height box that scrolls on its own.",
    imports: ["ScrollArea"],
    caption: "A list of months taller than its box.",
  },
  {
    id: "avatar",
    title: "Avatar",
    lead: "A person or an account, by initials.",
    imports: ["Avatar", "AvatarFallback"],
    caption: "Two accounts by their initials.",
  },
  {
    id: "collapsible",
    title: "Collapsible",
    lead: "Detail that stays out of the way until asked for.",
    imports: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"],
    caption: "How refunds are counted, shown on request.",
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
    imports: ["Table", "TableHeader", "TableBody", "TableFooter", "TableRow", "TableHead", "TableCell"],
    rules: [
      "Anything to sort or filter uses the data table.",
      "Column heads are small monospaced capitals; the theme sets them.",
      "A total goes in TableFooter: one rule above it, a double rule under it, no band.",
      'A row that needs a look takes data-tone="negative" or "warning" on its TableRow, a faint wash of the colour. The page decides; never mark a row from its sign alone.',
    ],
    caption: "A month-by-month cash flow in a card, with its total and August marked for a look.",
  },
];

const controls: Entry[] = [
  {
    id: "toggle-group",
    title: "Toggle group",
    lead: "Range and mode toggles, top right of a chart's card.",
    imports: ["ToggleGroup", "ToggleGroupItem"],
    caption: "A range toggle with 1Y pressed.",
  },
  {
    id: "toggle",
    title: "Toggle",
    lead: "A single on or off control.",
    imports: ["Toggle"],
    caption: "Hide amounts, an outline toggle with its icon.",
  },
  {
    id: "select",
    title: "Select",
    lead: "Pick one option from a short list.",
    imports: ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectGroup", "SelectItem"],
    caption: "Pick one store from a short list.",
  },
  {
    id: "input",
    title: "Input and textarea",
    lead: "Text entry, with an icon in an input group when the field needs one.",
    imports: ["Input", "InputGroup", "InputGroupAddon", "InputGroupInput", "Textarea"],
    caption: "A plain input, a search input with its icon, and a textarea.",
    more: [
      { name: "input-states", caption: "In a Field: labelled, with a hint, invalid with its error, and disabled." },
    ],
  },
  {
    id: "field",
    title: "Field",
    lead: "A form field: its label, the control, and a hint or an error under it, from shadcn's Field.",
    imports: ["Field", "FieldLabel", "FieldDescription", "FieldError"],
    rules: [
      "Every field is a Field with a FieldLabel above the control; the theme sets the label in small muted mono capitals, so a page writes no label styles.",
      "Focus is the control's own edge in the text colour, 2px thick; an invalid field keeps its red edge and takes a faint red wash, with its FieldError under it.",
      "A checkbox or switch label sits beside it in a horizontal Field and keeps the sans face.",
    ],
    caption: "A form for adding a holding: a hint, an invalid field with its error, a toggle group, a disabled field.",
  },
  {
    id: "slider",
    title: "Slider",
    lead: "A value or a range on a track.",
    imports: ["Slider"],
    caption: "A price range in steps of 5.",
  },
  {
    id: "calendar",
    title: "Calendar",
    lead: "Date picking, on react-day-picker.",
    imports: ["Calendar"],
    caption: "October 2026 with the 20th picked.",
  },
  {
    id: "tooltip",
    title: "Tooltip",
    lead: "A short label on hover or focus.",
    imports: ["Tooltip", "TooltipTrigger", "TooltipContent"],
    rules: ["SiyahiProvider already includes the tooltip provider."],
    caption: "Churn explained on hovering an info button.",
  },
  {
    id: "popover",
    title: "Popover",
    lead: "A short explanation or a small form, anchored to its trigger.",
    imports: ["Popover", "PopoverTrigger", "PopoverContent", "PopoverHeader", "PopoverTitle", "PopoverDescription"],
    caption: "How revenue is counted, opened from a button.",
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
    caption: "An order's parcels over the page, closed from its footer.",
  },
  {
    id: "sheet",
    title: "Sheet",
    lead: "A side panel, such as filters on a phone.",
    imports: ["Sheet", "SheetTrigger", "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription"],
    caption: "Order filters in a side panel.",
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
    caption: "An order's actions in a menu, a destructive one among them.",
  },
  {
    id: "context-menu",
    title: "Context menu",
    lead: "The same actions on right-click or long-press.",
    imports: ["ContextMenu", "ContextMenuTrigger", "ContextMenuContent", "ContextMenuItem"],
    caption: "Copy order number and Open order on right-click.",
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
