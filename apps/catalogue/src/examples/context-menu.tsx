import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@siyahi/ui";

export default function ContextMenuExample() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full">
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          Right-click or long-press here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Copy symbol</ContextMenuItem>
        <ContextMenuItem>Open chart</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
