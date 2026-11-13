# Siyahi design guidelines

These rules bind every page built on `@siyahi/ui`: The Book, Dash and any other
app. Agents must follow them when designing or changing UI; a reviewer treats a
breach as a defect. The catalogue (https://siyahi.jatinbansal.com) shows each
component; this file says how to use them.

## Colour

Colour is placed, not spread. A page is neutral greys plus colour that carries
a meaning:

- **Ink indigo** is the accent: links, the selected sidebar item, the first
  chart series, a chart's "today" rule and an `accent` `Callout`. Buttons, badges, toggles and focus
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
  rule: every bar is a tint inside a 1px full-colour edge, not a solid slab.
  A bar is read by its edge, which reaches 3:1 against the card; the tint is a
  fill carried by that edge: half its colour (`--bar-tint`, 50%), strong
  enough that a thin stacked segment, mostly edge, still shows its colour
  against the next, and a pale slot's bar does not read as the card.
- **Never a stripe down one side.** Do not mark a notice, card, row or quote
  with a left (or any single-side) coloured border; tint the box or add an
  icon. 1px neutral dividers between columns are separators, not accents, and
  are fine.
- **Edges that matter reach 3:1; the rest are hairlines.** A field's edge (input,
  textarea, select, input group, the command search) is `--input`, at 3:1 on the
  canvas and the card; dividers, card rings, gridlines and the outlines of
  buttons, toggles and code blocks are the `--border` hairline (the text colour
  at 18% in light, white at 20% in dark), firm enough to carry the page's
  structure. Focus is drawn inside the control, so no neighbour or clipping box
  covers it: a 2px ring in the text colour (`--ring`) on its edge with a 2px
  ring of the page colour inside, which reads on a black, white or hovered
  fill alike. A field shows it as its own edge, 2px in the text colour; a chart
  mark as a dashed stroke, apart from a picked mark's solid one. A destructive
  control and an invalid field focus in the destructive red. Menu items show
  focus as their highlight. A selected
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
  or `MetricStrip` item, `data-tone="negative"` or `"warning"` on a `TableRow`,
  and `getRowTone` on a `DataTableBody`, returning the tone for the row. It
  takes a faint wash of the colour over the card (7% in light, 12% in dark),
  and a tile or figure an outline of it. The page decides, never the sign: a falling cost is good news.
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
  toggles, menus, bars and tracks (data bars, progress, a slider's track and
  thumb, a scrollbar's thumb), heatmap cells, treemap tiles and the colour
  chips of charts and legends alike (`--radius` is 0). Only what is round by
  nature stays round: an avatar, a radio, a status dot, a line's end dot, a
  spinner, and a signed calendar heatmap's loss day, whose shape carries its
  sign. The theme squares every other rounding, on any component.
  Never add a `rounded-*` class to a box.
- **Floating surfaces lie flat.** Nothing casts a drop shadow: a menu, a
  list, a popover, a dialog, a sheet, a hover card and a chart's tooltip take
  the card's hairline for their edge, so they read as a sheet of the page.
- **Joined toggles.** The items of a `ToggleGroup` sit flush and share their
  borders, one control; the pressed item fills with the foreground.
- **A code block's copy button sits in a header row** (`CodeBlockHeader`),
  beside its title or alone, never floating over the code, where it would
  cover the end of a line. An untitled snippet takes the extra row.
- Badges stay boxed (an outline), the primary button and the pressed toggle
  black (white in dark), titles in the sans face, at normal spacing.

## Page header

An app page opens on its masthead, `PageHeader`: a small mark and eyebrow in the
mono face and link colour, the title, one muted line saying what the page is,
the actions at the right, and a hairline under it. One per page; no hero card.

## Words

A page is read by someone who acts on its figures. Its words are plain English,
in sentence case, and explain themselves: a reader needs no other page to know
what a figure is, where it came from and what to do next. These rules bind what
a page's reader sees. The catalogue's own notes (the text that introduces a
component, its rules and its captions) teach the package and are exempt from
them, and so are the words in a demo that only name a component's variant or API
("Ghost", "moneyCompact") or show a bare state (a field disabled with no reason
given). Everything else in an example is bound like any app's copy, including
the error, empty, loading and busy text of a state demo. Each rule's example is
from the catalogue.

- **A title states the finding** when the block makes one point: "Search is
  near its slowest of the month, login near its fastest". In an app, work its
  figures out from the data the block draws, so it cannot go stale. When the
  finding changes with the reader's choice (a toggle, a filter, a pick), the
  title names the topic instead: "Revenue by channel and quarter". No full
  stop, no pun or metaphor.
- **A description says what the figures are**: the measure, its scope and
  period, how it was counted, whatever the title left out. A single fragment
  takes no full stop: "Each month's revenue against its target". Once there are
  two parts, each ends with one: "Each week's balance against the highest it
  had been so far. At zero the bakery was at a new high." Page copy never names
  a component, a token or a prop.
- **Explain what the reader cannot guess.** Say how to read a mark that is not
  obvious ("Money in above the line, money out below it"), and define a term
  on first use, in the description, a tooltip or a popover: "Churn counts
  customers who did not renew this month."
- **Say where the figures come from and how fresh they are**: the system or
  report they are read from, "From sar -r", and when, "Prices as of the last
  market close."
- **Labels and column heads are short nouns, written in full.** The theme sets
  them in small mono capitals, so write them in sentence case and never
  abbreviate to fit: no "vs", "p95", "Qty". Name what the figure is, then its
  period if the block has several: "Cash flow this year". A note on a plot or
  beside a figure is lowercase: "new limit, 50%", "new this year".
- **Units.** A figure from the formatters carries its unit (₹2.4L, 14.2%,
  14:30 IST). Any other unit is named once: after a label in brackets, "Hour of
  day (IST)", or after a title with a comma, "Memory in use, GiB". Keep the
  symbols readers know (%, ₹, ms, s, GiB); anything else is a word. A
  difference between two percentages is in points, to one decimal, as no
  formatter writes them: "Sales is 5.6 points under its budget".
- **Numbers** go through `useFormat()` and `Delta`. In the default locale that
  is Indian grouping (1,53,110), compact rupees (₹3.1Cr) and amounts under a
  lakh in full; a page under another locale keeps its forms. A figure on its
  own (a cell, a tick, a tooltip) carries its sign, as Colour says; a sign you
  write is `+` or the minus `−`, never a hyphen: "+₹21,300", "−₹18,400". In a
  phrase a word may carry the direction instead: "5.6 points under". A range
  takes an en dash, "0–12 GiB"; a multiple takes ×, "about 1.5× a month". A
  missing figure is —, and a page that leaves items out says how many.
- **Dates and times** read as the formatters write them, in the default locale
  day before month: "20 Oct 2026, 14:30 IST". Every block says its time zone
  once, on its axis title, its description or each time: "Hour of day (IST)". A
  period is in words, "Last 30 days", "April to March"; a financial year is
  "FY26", with the block saying when it ends: "FY26 ends in March 2026". A
  tooltip's heading says more than the tick under it: "Week ending 1 Nov 2026"
  against "Nov".
- **A status names a state, not a task**, in a few words that match its tone:
  "Paid", "Out for delivery", "Needs review".
- **The components write the chart and staleness notes**: FORECAST, TODAY and
  "Stale · 3 Nov". The page passes the point or the date and nothing more, and
  says in its description which stretch is a forecast: "November and December
  are a forecast". It never writes a note of its own for the same thing.
- **A button or menu item says what happens**, as a verb, in one to three
  words: "Export CSV", "Copy order number". A busy button keeps its label as
  "Saving"; a finished one says so briefly, "Copied". An icon-only button names
  its action in `aria-label`: "Refresh". A toggle names its options in words
  ("Cumulative growth", "Last year"); only a range toggle in a card's header
  shortens them, to 1M, 6M, 1Y and All. A control disabled for a reason the
  page does not show says why beside it, as a chart's Log button does.
- **Empty, loading and error states say what happened and what to do.** Empty
  names what is missing and why: "No holding matches the search." Loading is
  a `Skeleton` in the block's shape; long work names itself, "Orders imported",
  with its progress, and a waiting line ends in one "…". An error's title says
  what happened, "Import failed"; its line says why and what the reader can
  do: "The CSV could not be read. Export it again and retry." A field's error
  states the rule with an example: "A PIN code is six digits, such as 560001".
- **Address the reader as you and the business as we**: "What you own, what it
  is worth today", "Our store".

## Labels and totals

- **Labels are small monospaced capitals**: a stat tile's label and footer
  lines, a `MetricStrip` label, a table's column heads, a sidebar group's
  label, a group's label in a menu, a select's list or the command palette,
  and a form field's label (muted, above the field). The components and
  the theme set them; never set a label in this style by hand elsewhere, and
  never set a figure or a title in it.
- **A total row reads as a ledger's**: in `TableFooter`, one rule above it and
  a double rule under it in the text colour, no band.

## Charts

- **Names at the line ends.** A line chart and overlapping areas name each
  series at its line's end, in the text colour beside a square of its colour,
  in a gutter after the last point; ends that crowd are spread 14px apart with
  a short leader. A legend goes below instead on a card under 400px wide (a
  phone), where the names would take more than 30% of it or not fit the
  plot's height, and where a line ends short of the plot's right edge (a
  missing last reading, a single point, an x axis running past the data). Bars and stacks
  keep a legend.
- **Five colours, then grey.** Past five series, the page names the few it is
  about in chart colours and gives the rest `var(--muted-foreground)`: they
  draw first, in grey. Every line is still named: a grey one's name at its end
  is muted with no square, and its place says which line it is. Never a count
  standing in for names. In the legend a grey name is a button that raises its
  line in the text colour, since a shared grey square cannot tell lines apart;
  a stack's grey bands read in the legend's order, bottom to top.
- **No fill under overlapping areas**: from three series on, fills bury each
  other. A stack fills each band with a flat tint, never a gradient.
- **The value axis just covers the data.** Unless the page fixes it, it ends
  on the round tick just past what is drawn (a 46,800 peak at 50,000, by
  10,000s), a stack's totals for a stack. Bars and stacks reach zero, since
  their length is the value; lines and overlapping areas need not, so a
  revenue line from ₹38L to ₹45L fills the plot rather than its top fifth.
- **Forecast and today.** `forecastFrom` dashes every line from that point,
  hatches the stretch faintly behind lines on card-coloured halos, labels it
  FORECAST and hollows the end dots (a stack keeps solid edges and no hatching:
  its fills cover the stretch);
  `today` is a 1px rule in the link colour, labelled TODAY.
- Gridlines are solid hairlines. Lines draw in left to right over 1.3s on
  first draw, a stack's fills revealed with them; then the names fade in, and
  each end dot as its line finishes; bars fade in rather than grow. Reduced
  motion shows them at once.
- **Stale data is marked by the page**: `stale` on a chart card or a
  `SectionCards` tile, with since when ("3 Nov"). The block greys and its
  chart or sparkline draws at about 65% strength, a tile's figure and badge
  turn muted, and a small "Stale · 3 Nov" note says so. A stale block is meant
  to be harder to read, so its marks are exempt from the 3:1 mark bar; the
  note and the figure keep their text contrast. Never infer it from dates.

## Tables

Tables are dense, as a ledger is: compact rows, a 1px rule in the text colour
under the column heads, the first column (what the row is) in medium weight,
and figures in the mono face. A figure is a cell marked `data-numeric`, which
also right-aligns it (the data table marks its number columns; a plain
`TableCell` or `TableHead` takes the attribute), and any `Delta` in a cell.
Alignment alone is not a figure. Row hairlines stay; never stripes, never
column rules.

## Forms

- Every field is a `Field` with a `FieldLabel` above the control, a
  `FieldDescription` hint or a `FieldError` under it. Never write a bare
  `<label>` with its own styles.
- An invalid field (`aria-invalid` on the control, `data-invalid` on its
  `Field`) keeps its red edge and takes a faint red wash.

## Sidebar

The sidebar is parted from the page by a hairline on its page-side edge, its
group labels are small monospaced capitals and its rows are compact. Its fill,
icons and the current page's mark stay as shadcn draws them.
