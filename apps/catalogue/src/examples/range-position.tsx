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
    <Card>
      <CardHeader>
        <CardTitle>HDFCBANK sits {f.pct((close - low) / (high - low), 0)} of the way up its 52-week range</CardTitle>
        <CardDescription>The last close against the year's lowest and highest close</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 md:flex-row md:items-end">
        <DataList className="md:w-56 md:shrink-0">
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
          className="md:flex-1"
        />
      </CardContent>
    </Card>
  );
}
