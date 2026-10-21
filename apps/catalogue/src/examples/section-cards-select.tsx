import { Delta, SectionCards, useFormat, type SectionCard } from "@siyahi/ui";
import { useState } from "react";

const classes = [
  { label: "All", net: 148600, positions: 212 },
  { label: "Equity", net: 171400, positions: 164 },
  { label: "Mutual funds", net: 38400, positions: 31 },
  { label: "F&O", net: -61200, positions: 17 },
];

export default function SectionCardsSelectExample() {
  const [scope, setScope] = useState("All");
  const { count } = useFormat();
  const items: SectionCard[] = classes.map((c) => ({
    label: c.label,
    value: <Delta value={c.net} format="money" />,
    detail: `${count(c.positions)} positions`,
  }));
  return (
    <div className="flex flex-col gap-3">
      <SectionCards items={items} selected={scope} onSelect={setScope} />
      <p className="text-sm text-muted-foreground">Showing {scope}</p>
    </div>
  );
}
