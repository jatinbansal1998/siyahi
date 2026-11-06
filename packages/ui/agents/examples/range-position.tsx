import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataList,
  DataListItem,
  RangePosition,
  useFormat,
} from "@siyahi/ui";

// Checkout's daily 95th-percentile response time over the last 30 days, in ms; made-up figures.
const low = 161;
const high = 203;
const today = 175;

export default function RangePositionExample() {
  const f = useFormat();
  const ms = (value: number) => `${f.count(value)} ms`;
  return (
    // Side by side once the card, not the screen, has room: in a narrow panel on a wide screen they stack.
    <Card className="@container/range">
      <CardHeader>
        <CardTitle>Checkout sits {f.pct((today - low) / (high - low), 0)} of the way up its 30-day range</CardTitle>
        <CardDescription>Today's response time against the month's fastest and slowest day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8 @xl/range:flex-row @xl/range:items-end">
          <DataList className="@xl/range:w-56 @xl/range:shrink-0">
            <DataListItem label="Fastest day, 3 weeks ago">
              <span className="tabular-nums">{ms(low)}</span>
            </DataListItem>
            <DataListItem label="Slowest day, 9 days ago">
              <span className="tabular-nums">{ms(high)}</span>
            </DataListItem>
            <DataListItem label="Today, 95th percentile">
              <span className="tabular-nums">{ms(today)}</span>
            </DataListItem>
          </DataList>
          <RangePosition
            low={low}
            high={high}
            value={today}
            lowLabel="30-day fastest"
            highLabel="30-day slowest"
            caption="of the way up the 30-day range"
            valueFormatter={ms}
            className="@xl/range:flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
