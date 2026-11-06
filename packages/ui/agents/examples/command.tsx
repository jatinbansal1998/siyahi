import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@siyahi/ui";
import { ChartLineIcon, LandmarkIcon, WalletIcon } from "lucide-react";

export default function CommandExample() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Command>
        <CommandInput placeholder="Jump to a page" />
        <CommandList>
          <CommandEmpty>No page matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem>
              <WalletIcon />
              Holdings
            </CommandItem>
            <CommandItem>
              <ChartLineIcon />
              Realized
            </CommandItem>
            <CommandItem>
              <LandmarkIcon />
              Cash flow
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
