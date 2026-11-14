/**
 * The tones a box can take: a faint wash of the colour inside a full border of it, with the colour itself kept for
 * an icon or a dot. Text inside stays in the text colours: small coloured text on its own wash falls under 4.5:1.
 * Callout, StatusAlert and StatusBadge share these, so a warning looks the same wherever it appears.
 */
export const TONES = {
  neutral: { box: "border-border bg-muted/50", ink: "text-muted-foreground!", dot: "bg-muted-foreground" },
  accent: { box: "border-link/35 bg-link/8", ink: "text-link!", dot: "bg-link" },
  warning: { box: "border-warning/45 bg-warning/10", ink: "text-warning!", dot: "bg-warning" },
  positive: { box: "border-positive/40 bg-positive/8", ink: "text-positive!", dot: "bg-positive" },
  negative: { box: "border-negative/40 bg-negative/8", ink: "text-negative!", dot: "bg-negative" },
} as const;

/** neutral for information, accent for a key point, warning for a caution, positive and negative for good and bad. */
export type Tone = keyof typeof TONES;
