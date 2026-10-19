import { Separator } from "@siyahi/ui";

export default function SeparatorExample() {
  return (
    <div className="flex h-6 items-center gap-4 text-sm">
      <span>Equity</span>
      <Separator orientation="vertical" />
      <span>Debt</span>
      <Separator orientation="vertical" />
      <span>Gold</span>
    </div>
  );
}
