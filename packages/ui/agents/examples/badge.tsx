import { Badge, Delta, StatusBadge } from "@siyahi/ui";

export default function BadgeExample() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="positive">Paid</StatusBadge>
        <StatusBadge tone="warning">Pending</StatusBadge>
        <StatusBadge tone="negative">Failed</StatusBadge>
        <StatusBadge tone="accent">New</StatusBadge>
        <StatusBadge>Draft</StatusBadge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Active</Badge>
        <Badge variant="secondary">Archived</Badge>
        <Badge variant="outline">Engineering</Badge>
        <Badge variant="outline">
          <Delta value={0.042} />
        </Badge>
        <Badge variant="outline">
          <Delta value={-0.013} />
        </Badge>
      </div>
    </div>
  );
}
