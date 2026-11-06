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
- **Green and red** mean a gain and a loss, always with ▲ or ▼ (`Delta`).
  **Amber** means caution. None of them decorates.
- **Emphasis tints the whole surface.** A caution is `WarningAlert`; a point set
  apart is `Callout` (`neutral`, `accent`, `warning`, `positive`,
  `negative`); a quotation is `Quote`. Each takes a faint wash of its colour
  inside a 1px border of the same colour all round. Large marks follow the same
  rule: gain and loss bars are a tint inside a full-colour edge, not solid
  slabs.
- **Never a stripe down one side.** Do not mark a notice, card, row or quote
  with a left (or any single-side) coloured border; tint the box or add an
  icon. 1px neutral dividers between columns are separators, not accents, and
  are fine.
- Categories (a broker, a sector, an asset class) stay neutral: outline badges,
  never a hue each. Ordered buckets (largest 5, next 5, rest) use steps of one
  colour, not separate hues.
