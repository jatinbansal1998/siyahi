import { Delta, SectionCards, useFormat, type SectionCard } from "@siyahi/ui";
import { useState } from "react";

const classes = [
  { label: "All", net: 110200, positions: 181 },
  { label: "Equity", net: 171400, positions: 164 },
  { label: "Gold bonds", net: 0, positions: 0 },
  { label: "F&O", net: -61200, positions: 17 },
];

export default function SectionCardsSelectExample() {
  const [scope, setScope] = useState("All");
  const { count } = useFormat();
  const items: SectionCard[] = classes.map((c) => ({
    label: c.label,
    value: <Delta value={c.net} format="money" />,
    detail: `${count(c.positions)} positions`,
    // Nothing to show for a class with no positions, so it cannot be picked.
    disabled: c.positions === 0,
  }));
  return (
    <div className="flex flex-col gap-3">
      <SectionCards items={items} selected={scope} onSelect={setScope} />
      <p className="text-sm text-muted-foreground">Showing {scope}</p>
    </div>
  );
}
