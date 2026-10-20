import { Tooltip, TooltipContent, TooltipTrigger } from "@siyahi/ui/components/ui/tooltip";
import { useFormat } from "@siyahi/ui/lib/format";

export interface LocalTimeProps {
  value: Date | number | string;
  /** Write the date, in the same zone, before the time: 20 Oct 2026, 14:30 IST. */
  withDate?: boolean;
}

/** A time in the configured zone (14:30 IST), with the viewer's own clock in a tooltip. */
export function LocalTime({ value, withDate = false }: LocalTimeProps) {
  const { time } = useFormat();
  const date = new Date(value);
  const viewer = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  return (
    <Tooltip>
      <TooltipTrigger render={<time dateTime={date.toISOString()} className="tabular-nums" />}>
        {time(date, { withDate })}
      </TooltipTrigger>
      <TooltipContent>Your time: {viewer}</TooltipContent>
    </Tooltip>
  );
}
