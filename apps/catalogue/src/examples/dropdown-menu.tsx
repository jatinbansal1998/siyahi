import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@siyahi/ui";
import { EllipsisIcon } from "lucide-react";

export default function DropdownMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="w-fit" />}>
        <EllipsisIcon />
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Holding</DropdownMenuLabel>
          <DropdownMenuItem>View lots</DropdownMenuItem>
          <DropdownMenuItem>Export CSV</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Hide</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
