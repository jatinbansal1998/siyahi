import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@siyahi/ui";
import { ChartLineIcon, PackageIcon, UsersIcon } from "lucide-react";

export default function CommandExample() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Command>
        <CommandInput placeholder="Jump to a page" />
        <CommandList>
          <CommandEmpty>No page matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem>
              <PackageIcon />
              Orders
            </CommandItem>
            <CommandItem>
              <ChartLineIcon />
              Revenue
            </CommandItem>
            <CommandItem>
              <UsersIcon />
              Customers
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
