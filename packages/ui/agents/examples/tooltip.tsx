import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@siyahi/ui";
import { InfoIcon } from "lucide-react";

export default function TooltipExample() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="About churn" />}>
        <InfoIcon />
      </TooltipTrigger>
      <TooltipContent>Churn counts customers who did not renew this month.</TooltipContent>
    </Tooltip>
  );
}
