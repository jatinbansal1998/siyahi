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

// HDFCBANK over the last 52 weeks; made-up figures.
const low = 1613.6;
const high = 2027.4;
const close = 1750.0;

export default function RangePositionExample() {
  const f = useFormat();
  const price = (value: number) => f.money(value, 2);
  return (
    // Side by side once the card, not the screen, has room: in a narrow panel on a wide screen they stack.
    <Card className="@container/range">
      <CardHeader>
        <CardTitle>HDFCBANK sits {f.pct((close - low) / (high - low), 0)} of the way up its 52-week range</CardTitle>
        <CardDescription>The last close against the year's lowest and highest close</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8 @xl/range:flex-row @xl/range:items-end">
          <DataList className="@xl/range:w-56 @xl/range:shrink-0">
            <DataListItem label="52-week low, 7 months ago">
              <span className="tabular-nums">{price(low)}</span>
            </DataListItem>
            <DataListItem label="52-week high, 11 weeks ago">
              <span className="tabular-nums">{price(high)}</span>
            </DataListItem>
            <DataListItem label="Last close">
              <span className="tabular-nums">{price(close)}</span>
            </DataListItem>
          </DataList>
          <RangePosition
            low={low}
            high={high}
            value={close}
            lowLabel="52-week low"
            highLabel="52-week high"
            caption="of the way up the 52-week range"
            valueFormatter={price}
            className="@xl/range:flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
