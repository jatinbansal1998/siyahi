import { Separator } from "@siyahi/ui";

export default function SeparatorExample() {
  return (
    <div className="flex h-6 items-center gap-4 text-sm">
      <span>Orders</span>
      <Separator orientation="vertical" />
      <span>Customers</span>
      <Separator orientation="vertical" />
      <span>Products</span>
    </div>
  );
}
