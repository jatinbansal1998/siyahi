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
- **Edges that matter reach 3:1; the rest stay faint.** A field's edge (input,
  textarea, select, input group, the command search) is `--input`, at 3:1 on the
  canvas and the card; dividers, card rings, gridlines and the outlines of
  buttons, toggles and code blocks are the faint `--border`. Focus is an opaque
  `--ring`, or the opaque destructive red on a destructive control. A selected
  toggle or pill tab fills with the foreground. A chart bar that a selection
  dims keeps its full-colour outline and fades only inside.
- **Destructive is not loss.** `--destructive` (delete, an invalid field) is a
  deeper red than `--negative` (a loss figure), so its label reads on its own
  tint; never use one for the other.
- Categories (a team, a region, a product line) stay neutral: outline badges,
  never a hue each. Ordered buckets (largest 5, next 5, rest) use steps of one
  colour, not separate hues.
