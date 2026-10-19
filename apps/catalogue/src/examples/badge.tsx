import { Badge, Delta } from "@siyahi/ui";

export default function BadgeExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Equity</Badge>
      <Badge variant="secondary">Mutual fund</Badge>
      <Badge variant="outline">Zerodha</Badge>
      <Badge variant="destructive">Failed</Badge>
      <Badge variant="outline">
        <Delta value={0.042} />
      </Badge>
      <Badge variant="outline">
        <Delta value={-0.013} />
      </Badge>
    </div>
  );
}
