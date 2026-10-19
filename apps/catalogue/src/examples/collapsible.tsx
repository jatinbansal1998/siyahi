import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@siyahi/ui";
import { ChevronsUpDownIcon } from "lucide-react";

export default function CollapsibleExample() {
  return (
    <Collapsible className="flex max-w-sm flex-col gap-2">
      <CollapsibleTrigger render={<Button variant="outline" className="w-fit" />}>
        <ChevronsUpDownIcon />
        How lots are matched
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground">
        Sells are matched to the oldest buy first, as the tax rules require.
      </CollapsibleContent>
    </Collapsible>
  );
}
