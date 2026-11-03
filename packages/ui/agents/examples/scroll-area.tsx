import { ScrollArea, Separator } from "@siyahi/ui";

const months = Array.from({ length: 24 }, (_, i) =>
  new Date(2025, i, 1).toLocaleString("en-IN", { month: "long", year: "numeric" }),
);

export default function ScrollAreaExample() {
  return (
    <ScrollArea className="h-48 w-56 rounded-lg border">
      <div className="p-4">
        {months.map((month) => (
          <div key={month}>
            <div className="text-sm">{month}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
