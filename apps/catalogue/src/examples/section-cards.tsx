import { Delta, SectionCards, type SectionCard, useFormat } from "@siyahi/ui";

export default function SectionCardsExample() {
  const { money, moneyCompact } = useFormat();
  const items: SectionCard[] = [
    {
      label: "Portfolio value",
      value: money(4512300),
      badge: <Delta value={0.031} />,
      headline: "Up for the third month",
      detail: "Valued at the last close",
    },
    {
      label: "Invested",
      value: money(4025000),
      headline: "SIPs on the 5th and 20th",
      detail: "Across 4 accounts",
    },
    {
      label: "Unrealised gain",
      value: moneyCompact(487300),
      badge: <Delta value={0.121} />,
      headline: "XIRR 14.2%",
      detail: "Since the first buy",
    },
    {
      label: "Realised this year",
      value: moneyCompact(-61200),
      badge: <Delta value={-61200} format="money" />,
      headline: "Two loss-making exits",
      detail: "Before tax",
    },
    {
      label: "Dividends this year",
      value: moneyCompact(38400),
      badge: <Delta value={0.18} />,
      headline: "From 11 holdings",
      detail: "Credited to the bank",
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
