import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@siyahi/ui";
import { ChevronsUpDownIcon } from "lucide-react";

export default function CollapsibleExample() {
  return (
    <Collapsible className="flex max-w-sm flex-col gap-2">
      <CollapsibleTrigger render={<Button variant="outline" className="w-fit" />}>
        <ChevronsUpDownIcon />
        How refunds are counted
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-muted-foreground">
          A refund comes off the month the order was placed in, not the month it was paid.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
