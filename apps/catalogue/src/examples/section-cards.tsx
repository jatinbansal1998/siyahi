import { Delta, SectionCards, type SectionCard, useFormat } from "@siyahi/ui";

export default function SectionCardsExample() {
  const { money, moneyCompact } = useFormat();
  const items: SectionCard[] = [
    {
      label: "Revenue",
      value: money(4512300),
      badge: <Delta value={0.031} />,
      headline: "Up for the third month",
      detail: "Paid orders, less refunds",
    },
    {
      label: "Target",
      value: money(4025000),
      headline: "Set at the start of the quarter",
      detail: "Across 4 stores",
    },
    {
      label: "Ahead of target",
      value: moneyCompact(487300),
      badge: <Delta value={0.121} />,
      headline: "Gross margin 14.2%",
      detail: "Since April",
    },
    {
      label: "Cash flow this year",
      value: moneyCompact(-61200),
      badge: <Delta value={-61200} format="money" />,
      headline: "Two large inventory buys",
      detail: "Before tax",
    },
    {
      label: "Gift cards this year",
      value: moneyCompact(38400),
      badge: <Delta value={0.18} />,
      headline: "Sold in 11 stores",
      detail: "Paid at purchase",
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <SectionCards items={items.slice(0, 3)} />
      <SectionCards items={items.slice(0, 4)} />
      <SectionCards items={items} />
    </div>
  );
}
