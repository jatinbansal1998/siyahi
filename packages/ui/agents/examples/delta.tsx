import { Delta } from "@siyahi/ui";

export default function DeltaExample() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Delta value={0.0234} />
      <Delta value={-0.0108} />
      <Delta value={0} />
      <Delta value={18250} format="money" />
      <Delta value={-4300} format="money" />
    </div>
  );
}
