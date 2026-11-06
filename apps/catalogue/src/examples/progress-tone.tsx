import { ToneProgress, useFormat } from "@siyahi/ui";

// Each sales channel's profit or loss this quarter, and its share of all the profit and loss booked; made-up figures.
const channels = [
  { channel: "Online", profit: 84200, share: 0.41 },
  { channel: "Retail", profit: -61200, share: 0.3 },
  { channel: "Export", profit: 21000, share: 0.1 },
];

export default function ProgressToneExample() {
  const { pct } = useFormat();
  return (
    <div className="flex max-w-sm flex-col gap-3 text-sm">
      {channels.map((p) => (
        <div key={p.channel} className="flex items-center gap-3">
          <span className="w-16 font-medium">{p.channel}</span>
          <ToneProgress
            tone={p.profit >= 0 ? "positive" : "negative"}
            value={p.share * 100}
            aria-label={`${p.channel}'s share of the quarter's profit and loss`}
            getAriaValueText={() => pct(p.share)}
            className="w-24"
          />
          <span className="tabular-nums">{pct(p.share)}</span>
        </div>
      ))}
    </div>
  );
}
