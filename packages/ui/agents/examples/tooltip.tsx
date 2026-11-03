import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@siyahi/ui";
import { InfoIcon } from "lucide-react";

export default function TooltipExample() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="About XIRR" />}>
        <InfoIcon />
      </TooltipTrigger>
      <TooltipContent>XIRR weighs every cash flow by its date.</TooltipContent>
    </Tooltip>
  );
}
