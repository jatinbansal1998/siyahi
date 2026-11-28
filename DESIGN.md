# Siyahi design guidelines

These rules bind every page built on `@siyahi/ui`: The Book, Dash and any other
app. Agents must follow them when designing or changing UI; a reviewer treats a
breach as a defect. The catalogue (https://siyahi.jatinbansal.com) shows each
component; this file says how to use them.

## Colour

Colour is placed, not spread. A page is neutral greys plus colour that carries
a meaning:

- **Terminal amber** is the accent: links, the page's eyebrow and panel
  numbers, the selected sidebar item and an `accent` `Callout`. Buttons,
  badges, toggles and focus stay monochrome. Charts keep their own five-hue
  palette, indigo first.
- **Green and red** mean good news and bad. A signed figure is `Delta`: the figure in the text colour with its
  `+` or `−`, and only a small trend icon in green or red. In plain text (labels, tooltips) write the sign with
  `signed(value, money)`; never
  colour a run of figures green and red. A rise is green unless the page says otherwise: for a cost, a debt or a
  fear gauge such as India VIX, `rise="bad"` on `Delta` (`rise: "bad"` on a `MetricStrip` item, which also
  colours its sparkline; `rise="bad"` on `ChangeBar`, `ChangeGrid` and `Treemap` with its legend, which tint by it)
  shows a rise in red and a fall in green. The sign and the arrow still follow the number.
  **Yellow** means caution, kept apart from the amber accent. None of them decorates.
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
  focus as their highlight. A selected toggle or pill tab fills with the
  foreground, as stock's faint grey cannot be told from the rest. A chart bar that a selection
  dims keeps its full-colour outline and fades only inside.
- **Destructive is not loss.** `--destructive` (delete, an invalid field) is a
  deeper red than `--negative` (a loss figure), so its label reads on its own
  tint; never use one for the other.
- Categories (a team, a region, a product line) stay neutral: outline badges,
  never a hue each. Ordered buckets (largest 5, next 5, rest) use steps of one
  colour, not separate hues.
- **Colour marks exceptions.** The one figure or table row that needs a look
  is marked by the page: `tone: "negative"` or `"warning"` on a `MetricStrip`
  item, `data-tone="negative"` or `"warning"` on a `TableRow`,
  and `getRowTone` on a `DataTableBody`, returning the tone for the row. It
  takes a faint wash of the colour over the card (7% in light, 12% in dark),
  and a figure an outline of it, reaching 8px past the figure so its text
  stays in line with its neighbours'. The page decides, never the sign: a falling cost is good news.
  Mark one or two; a page where every row is washed marks nothing.

## Surfaces

A data block sits open on the page: a `Card` has no fill, no ring and no
padding, so its content sits level with the page's text. Space, not a box or a
rule, parts the blocks: 16px across and 12px down in a `PanelGrid`, 16px
between `MetricStrip` figures. A lighter box on the canvas cuts off abruptly
and spends room on its own padding, so data sits on the page. `--card` is the
page colour, so what a block's marks mix into is what lies under them. The
page colour is fixed: never tint the canvas.

## Density

A page is read on a phone, a laptop and a large monitor, and each gets more of
the page, not bigger type.

- **Lay out by the room, not the device.** `PanelGrid` and the tile rows step
  their columns by their own width (container queries), so a block inside a
  sidebar layout or a one-file page steps the same way. Below 42rem blocks
  stack; from 42rem they sit two or three across.
- **A large monitor shows more blocks, not wider ones.** From a 140rem grid a
  `PanelGrid` of 2 takes a third block across, and from 180rem a grid of 2 or
  3 a fourth, when it holds that many. Text stays at its size.
- **A chart's height follows its width** unless the page fixes one: 45% of
  its width, from 240px on a phone to 420px, so a chart on a wide screen
  stays a chart and one on a phone keeps room for its marks. Fix a height
  only where the block must line up with a neighbour. A page that leads
  with one chart, such as an instrument's price, raises that chart's floor
  to 360px (`minHeight: 360` on its first pane), so on a phone it is the
  page's main block rather than a strip; from 800px wide it follows its
  width as any chart. One chart per page, never the blocks under it.
- **Gaps are set, not invented.** Stack a page's blocks 16px apart
  (`gap-4`) and its `PageSection`s 24px apart (`gap-6`), the room each
  section keeps under its rule; add no padding or gap of your own around a
  block.

Every `PanelGrid` numbers its blocks 01, 02 before their card title, in the
mono face and the link colour, so the text can point to one.

## Shape

- **The look is shadcn's, set by tokens.** Siyahi sets colours, fonts,
  `--radius` and shadows; stock components keep the shape and states shadcn
  gives them. Beyond the terminal's type (Type, below), the theme restyles a
  stock component only to fix a measured problem (contrast, clipping, touch
  targets, density), never for taste.
- **Square corners**: `--radius` is 0, so every corner a component takes from
  the theme is square. A part shadcn rounds fully (a dot, a pill, a switch)
  stays round. Never add a `rounded-*` class to a box.
- **Floating surfaces lie flat.** Nothing casts a drop shadow: every shadow
  size is transparent.
- Badges stay boxed (an outline), the primary button and the pressed toggle
  black (white in dark).

## Type

Siyahi reads as a terminal. The page is set in JetBrains Mono, drawn at 92.3%
of the font size so a character is 0.55 of a font size wide (6.65px at 12px),
and a table fits its columns and a row its words on one line:
figures, labels, controls, titles and tables share one grid. Tables set it at
13px. Text that reads as sentences, a
paragraph, a quote or a description, is set in Geist, where mono
tires the eye over a line; the theme switches it by element, so a page writes
no font classes. A value in a details list (`DataList`) is a figure or a
label, as a table cell is, and stays mono; one that reads as a sentence is
written as a paragraph (`<p>`) inside it. Labels over data (a `MetricStrip` figure's label, a table's
column heads, a sidebar group's label, a group's label in a menu) are small
capitals, muted. Never set a figure or a title in them.

## Page header

An app page opens on its masthead, `PageHeader`: a small mark and eyebrow in the
mono face and link colour, the title, one muted line saying what the page is,
the actions at the right, and a hairline under it. One per page; no hero card.

A page may lead with its two to four main figures as a headline, under the
masthead: `MetricStrip` with `variant="blocks"`, each figure on a solid block
(the headline orange, then the text colour, then a grey), touching, its value
large and every word in the block's own ink. It draws no sparkline and no
tone, so an exception goes in a strip below it.

A page about one number, a portfolio's worth or a share's price, leads with
that number instead: `MetricStrip` with `variant="lead"`. The first figure is
the largest thing on the page, in the text colour on the open page with no
box, block or colour of its own, its change and one muted line (when it was
read) under it; one or two supporting figures may sit beside it at the
strip's size. Its size follows the strip's width, so a figure of up to
sixteen characters (₹12,45,23,800.50) fits a phone; pass a longer one in its
compact form. Choose blocks when the page weighs several figures equally,
the lead when one figure is what the reader came for. One headline per page,
blocks or lead, never both.

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
  difference between two percentages is in points, to one decimal, the
  figure from `fixed` and the word written: "Sales is 5.6 points under its
  budget".
- **Numbers** go through `useFormat()` and `Delta`, never `toFixed` or a
  page's own `Intl.NumberFormat`. In the default locale that is Indian
  grouping (1,53,110), compact rupees (₹3.1Cr, ₹3,412 Cr, ₹1.2L Cr) and
  amounts under a lakh in full; a page under another locale keeps its forms.
  An index level or other plain decimal is `fixed` (24,312.45), a multiple is
  `multiple` (2.4×). A figure on its own (a cell, a tick, a tooltip) carries
  its sign, as Colour says; a sign is `+` or the minus `−`, never a hyphen,
  as the formatters write it: "+₹21,300", "−₹18,400". In a phrase a word may
  carry the direction instead: "5.6 points under". A range
  takes an en dash, "0–12 GiB"; a multiple takes ×, "about 1.5× a month". A
  missing figure is —, and a page that leaves items out says how many.
- **Dates and times** read as the formatters write them, in the default locale
  day before month: "20 Oct 2026, 14:30 IST", and a short month in three
  letters, "Sep" as the formatters and hand-written month labels write it,
  never "Sept". Every block says its time zone
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

- **Labels over data are small capitals** (Type, above). The components and
  the theme set them; never set a label in this style by hand.
- **A total row** goes in `TableFooter`.

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
- **A bridge may cut its axis, and then draws no total as a bar.** Where a
  waterfall's changes are small beside its totals (₹24L on a ₹1Cr
  portfolio, 103 points on an index at 24,415), the page starts its value
  axis near the levels (`yFrom`). A change keeps its true length on a cut
  axis, since it is a difference; a total would not, so each total is a 2px
  line at its level, and two slashes on the axis' foot, where zero would be,
  mark the cut. No other bar chart cuts its axis.
- **A mark on a value sits at that value.** A histogram's lines (a
  percentile, zero, today's move) sit where their value falls on the axis,
  whose ticks sit on the bucket edges they name, never in a bucket's middle.
  Each is named beside its line, on the side where the name stays on the
  plot and crosses no other mark, and its value is written under the chart.
- **Forecast and today.** `forecastFrom` dashes every line from that point,
  hatches the stretch faintly behind lines on card-coloured halos, labels it
  FORECAST and hollows the end dots (a stack keeps solid edges and no hatching:
  its fills cover the stretch);
  `today` is a 1px rule in the link colour, labelled TODAY.
- **A tooltip leaves the neighbours in view.** It sits centred on the hovered
  category, above its columns and lines (below them where there is no room
  above), right of sideways bars, and inside the plot, so the reader can still
  compare the hovered category with the ones beside it.
- **A name on a mark is never on hover alone**: a phone has no hover. A
  treemap tile too small for its name and figure has them written out under
  the map.
- Gridlines are solid hairlines, the scatter chart's too. Lines draw in left to right over 1.3s on
  first draw, a stack's fills revealed with them; then the names fade in, and
  each end dot as its line finishes; bars fade in rather than grow. Reduced
  motion shows them at once.
- **Dates and times a reader explores go on `TimeSeriesChartCard`**: a long
  daily series, a price, anything intraday. It pans, zooms and gives every
  series' value at the crosshair, so its series are named in a legend at the
  top of each pane with those values, not at the line ends, and it draws at
  once, with no draw-in. One measure per pane. Its volume bars and
  candlesticks are a few pixels wide, all edge, so they draw solid. A
  baseline and candlesticks take green and red, so they are for a gain and a
  loss only. Its axis ticks drop what a round value does not need: a price's
  ticks in whole rupees (`tickFormat`), its legend to the paisa. Its notes
  (`events`, such as results days) sit above the line with a short leader
  where they lift off it; those with no room are written out under the chart
  with their dates, so keep a note to a few words. Months, categories, bars,
  stacks and forecasts stay with the other chart cards.
- **Charts over one axis hover together.** Where blocks side by side cover the same months or categories, the page
  gives their chart cards one `syncId`: hovering October in one marks October in each of them, with the same band or
  line and tooltip as a hover of its own, so the page reads as one instrument. Charts over different axes (months
  beside quarters, a time beside a category) never share an id, as a linked mark would point at nothing.
- **Stale data is marked by the page**: `stale` on a chart card or a
  `MetricStrip` item, with since when ("3 Nov"). The block greys and its
  chart or sparkline draws at about 65% strength, a figure turns muted, and a small "Stale · 3 Nov" note says so. A stale block is meant
  to be harder to read, so its marks are exempt from the 3:1 mark bar; the
  note and the figure keep their text contrast. Never infer it from dates.

## Tables

Tables are dense: compact rows, and column heads in small muted capitals.
A number column is marked
`data-numeric`, which right-aligns it, so figures line up by their units (the
data table marks its number columns; a plain `TableCell` or `TableHead` takes
the attribute). Row hairlines stay; never stripes, never column rules.

- **A table is as wide as its columns**, up to its block, so each figure sits
  by its label rather than across a band of blank space; a wider table
  scrolls sideways inside its block. Where a table must fill its block, such
  as one lined up with a chart beside it, the page sets `--table-width: 100%`
  on its card.
- **A row is one line tall**, so the rows read as an even grid (a compact
  table folding a hidden figure under a kept one is the exception). A cell holds
  one thing: a name's kind or category goes in a column of its own, as plain
  text, never beside the name in its cell, where on a narrow block it wraps
  under the name and doubles that row.

## Forms

- Every field is a `Field` with a `FieldLabel` above the control, a
  `FieldDescription` hint or a `FieldError` under it. Never write a bare
  `<label>` with its own styles.
- An invalid field (`aria-invalid` on the control, `data-invalid` on its
  `Field`) keeps its red edge and takes a faint red wash.

## Sidebar

The sidebar is parted from the page by a hairline on its page-side edge, its
group labels are small capitals and its rows are compact. Everything else
stays as shadcn draws it.
