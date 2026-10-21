import { ToneProgress, useFormat } from "@siyahi/ui";

const positions = [
  { symbol: "INFY", realized: 84200, share: 0.41 },
  { symbol: "ITC", realized: -61200, share: 0.3 },
  { symbol: "TCS", realized: 21000, share: 0.1 },
];

export default function ProgressToneExample() {
  const { pct } = useFormat();
  return (
    <div className="flex max-w-sm flex-col gap-3 text-sm">
      {positions.map((p) => (
        <div key={p.symbol} className="flex items-center gap-3">
          <span className="w-16 font-medium">{p.symbol}</span>
          <ToneProgress
            tone={p.realized >= 0 ? "positive" : "negative"}
            value={p.share * 100}
            aria-label={`${p.symbol}'s share of the booked P&L`}
            getAriaValueText={() => pct(p.share)}
            className="w-24"
          />
          <span className="tabular-nums">{pct(p.share)}</span>
        </div>
      ))}
    </div>
  );
}
