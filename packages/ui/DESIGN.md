# Siyahi design guidelines

These rules bind every page built on `@siyahi/ui`: The Book, Dash and any other
app. Agents must follow them when designing or changing UI; a reviewer treats a
breach as a defect. The catalogue (https://siyahi.jatinbansal.com) shows each
component; this file says how to use them.

## Colour

Colour is placed, not spread. A page is neutral greys plus colour that carries
a meaning:

- **Ink indigo** is the accent: links, focus rings, the selected sidebar item,
  the first chart series and an `accent` `Callout`. Buttons, badges and toggles
  stay monochrome.
- **Green and red** mean a gain and a loss. A signed figure is `Delta`: the figure in the text colour with its
  `+` or `−`, and only a small trend icon in green or red. In plain text (labels, tooltips) write the sign; never
  colour a run of figures green and red.
  **Amber** means caution. None of them decorates.
- **Emphasis tints the whole surface.** A notice is `StatusAlert` in its tone (an
  error reads like a warning, only red); a state is `StatusBadge`; a point set
  apart is `Callout` (`neutral`, `accent`, `warning`, `positive`,
  `negative`); a quotation is `Quote`. Each takes a faint wash of its colour
  inside a 1px border of the same colour all round. Large marks follow the same
  rule: gain and loss bars are a tint inside a full-colour edge, not solid
  slabs.
- **Never a stripe down one side.** Do not mark a notice, card, row or quote
  with a left (or any single-side) coloured border; tint the box or add an
  icon. 1px neutral dividers between columns are separators, not accents, and
  are fine.
- **Edges that matter reach 3:1; the rest are hairlines.** A field's edge (input,
  textarea, select, input group, the command search) is `--input`, at 3:1 on the
  canvas and the card; dividers, card rings, gridlines and the outlines of
  buttons, toggles and code blocks are the `--border` hairline (the text colour
  at 18% in light, white at 20% in dark), firm enough to carry the page's
  structure. Focus is an opaque
  `--ring`, or the opaque destructive red on a destructive control. A selected
  toggle or pill tab fills with the foreground. A chart bar that a selection
  dims keeps its full-colour outline and fades only inside.
- **Destructive is not loss.** `--destructive` (delete, an invalid field) is a
  deeper red than `--negative` (a loss figure), so its label reads on its own
  tint; never use one for the other.
- Categories (a team, a region, a product line) stay neutral: outline badges,
  never a hue each. Ordered buckets (largest 5, next 5, rest) use steps of one
  colour, not separate hues.
- **Colour marks exceptions.** The one stat tile or table row that needs a look
  is marked by the page: `tone: "negative"` or `"warning"` on a `SectionCards`
  item, `data-tone="negative"` or `"warning"` on a `TableRow`. It takes a faint
  wash of the colour over the card (7% in light, 12% in dark), and a tile an
  outline of it. The page decides, never the sign: a falling cost is good news.
  Mark one or two; a page where every row is washed marks nothing.

## Surfaces

`SiyahiProvider`'s `surface` sets how a data block sits on the page. The page
and card colours are fixed: never tint the canvas.

- **`ruled`** (the default, with or without a provider): ruled on white. The
  blocks of a `PanelGrid`, the tiles of a `SectionCards` row and the figures
  of a `MetricStrip` are filled with the card colour and parted by hairlines,
  with a rule above and below the group and none on its left and right edges.
  A card standing alone (a `MetricStrip`, a table's card) takes the same rules
  above and below itself. A short last row ends in a blank cell, ruled off
  like the rest. A stat tile keeps its footer's top rule and faint band. Set
  nothing to get it.
- **`card`**: tight square cards, for a page of separate blocks, such as an
  index of links. Each block is filled with the card colour inside a hairline
  ring, with no shadow, 8px from the next in a `PanelGrid` or a row of
  `SectionCards`. Ask for it with `surface="card"`.
- **`open`**: no fill, no lines and no padding, so a block sits level with the
  page's text, for pages read top to bottom.

Every `PanelGrid` numbers its blocks 01, 02 before their card title, in the
mono face and the link colour, so the text can point to one.

## Shape

- **Square corners everywhere**: panels, cards, buttons, fields, badges,
  toggles, menus, and bars and tracks (data bars, progress) alike (`--radius`
  is 0). Only a dot, an avatar, a slider, a spinner or a scrollbar is round;
  the stock chart tooltip's colour chips keep shadcn's 2px. Never add a
  `rounded-*` class to a box.
- **Joined toggles.** The items of a `ToggleGroup` sit flush and share their
  borders, one control; the pressed item fills with the foreground.
- Badges stay boxed (an outline), the primary button and the pressed toggle
  black (white in dark), titles in the sans face, at normal spacing.

## Page header

An app page opens on its masthead, `PageHero`: a small mark and eyebrow in the
mono face and link colour, the title, one muted line saying what the page is,
the actions at the right, and a hairline under it. One per page; no hero card.

## Labels and totals

- **Labels over figures are small monospaced capitals**: a stat tile's label
  and footer lines, a `MetricStrip` label, a table's column heads. The
  components and the theme set them; never set a label in this style by hand
  elsewhere, and never set a figure or a title in it.
- **A total row reads as a ledger's**: in `TableFooter`, one rule above it and
  a double rule under it in the text colour, no band.
