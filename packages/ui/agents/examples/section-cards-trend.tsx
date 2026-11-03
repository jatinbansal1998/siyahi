import { Delta, SectionCards, Sparkline, useFormat, type SectionCard } from "@siyahi/ui";

export default function SectionCardsTrendExample() {
  const { money, moneyCompact } = useFormat();
  const items: SectionCard[] = [
    {
      label: "Portfolio value",
      value: money(4512300),
      badge: <Delta value={0.031} />,
      trend: <Sparkline data={[3820000, 3950000, 4110000, 4020000, 4380000, 4512300]} />,
      detail: "Month-end, last six months",
    },
    {
      label: "Realised this year",
      value: moneyCompact(-61200),
      badge: <Delta value={-61200} format="money" />,
      // A run of losses: the meaning colour, not a chart slot.
      trend: <Sparkline data={[0, -8200, -14100, -30400, -52800, -61200]} color="var(--negative)" />,
      detail: "Running total since April",
    },
    {
      label: "Dividends this year",
      value: moneyCompact(38400),
      badge: <Delta value={0.18} />,
      trend: <Sparkline data={[4100, 0, 12800, 3300, 9900, 8300]} variant="line" curve="linear" />,
      detail: "Credited each month",
    },
  ];
  return <SectionCards items={items} />;
}
