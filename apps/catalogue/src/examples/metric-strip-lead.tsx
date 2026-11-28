import { MetricStrip, useFormat } from "@siyahi/ui";

export default function MetricStripLeadExample() {
  const { money } = useFormat();
  // A share's page is about its price: the one figure, large, with the day's move and when it was read.
  return (
    <MetricStrip
      variant="lead"
      items={[
        {
          label: "Narmada Cement, last price",
          value: money(2418.65, 2),
          change: 0.0184,
          note: "today, at the close on 27 Nov 2026, 15:30 IST",
        },
      ]}
    />
  );
}
