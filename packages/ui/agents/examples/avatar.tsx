import { Avatar, AvatarFallback } from "@siyahi/ui";

export default function AvatarExample() {
  return (
    <div className="flex gap-2">
      <Avatar>
        <AvatarFallback>JB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>HU</AvatarFallback>
      </Avatar>
    </div>
  );
}
