import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup } from "@siyahi/ui";

export default function AvatarExample() {
  return (
    <div className="flex items-center gap-6">
      <Avatar>
        <AvatarFallback>JB</AvatarFallback>
      </Avatar>
      {/* A group overlaps its avatars; the first one's badge stays over its neighbour. */}
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>JB</AvatarFallback>
          <AvatarBadge aria-label="Online" />
        </Avatar>
        <Avatar>
          <AvatarFallback>HU</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </div>
  );
}
