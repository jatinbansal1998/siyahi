import { Tooltip, TooltipContent, TooltipTrigger } from "@siyahi/ui/components/ui/tooltip";
import { useFormat } from "@siyahi/ui/lib/format";

export interface LocalTimeProps {
  value: Date | number | string;
}

/** A time in the configured zone (14:30 IST), with the viewer's own clock in a tooltip. */
export function LocalTime({ value }: LocalTimeProps) {
  const { time } = useFormat();
  const date = new Date(value);
  const viewer = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  return (
    <Tooltip>
      <TooltipTrigger render={<time dateTime={date.toISOString()} className="tabular-nums" />}>
        {time(date)}
      </TooltipTrigger>
      <TooltipContent>Your time: {viewer}</TooltipContent>
    </Tooltip>
  );
}
