import { Delta } from "@siyahi/ui";

export default function DeltaRiseBadExample() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <Delta value={0.124} rise="bad" />
        <Delta value={-0.067} rise="bad" />
        <Delta value={2350} format="money" rise="bad" />
        <Delta value={-8400} format="money" rise="bad" />
      </div>
      <p>
        India VIX, the market's gauge of fear, is <Delta value={0.124} rise="bad" /> today, and this month's costs are{" "}
        <Delta value={-8400} format="money" rise="bad" /> against October.
      </p>
    </div>
  );
}
