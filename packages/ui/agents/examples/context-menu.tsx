import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@siyahi/ui";

export default function ContextMenuExample() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full">
        <div className="flex h-24 items-center justify-center border text-muted-foreground">
          Right-click or long-press here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Order</ContextMenuLabel>
          <ContextMenuItem>Copy order number</ContextMenuItem>
          <ContextMenuItem>Open order</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
