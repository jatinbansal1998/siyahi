import { Callout, Quote, WarningAlert, AlertDescription, AlertTitle } from "@siyahi/ui";
import { LightbulbIcon, InfoIcon, TriangleAlertIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

export default function CalloutExample() {
  return (
    <div className="grid max-w-2xl gap-3">
      <Callout tone="accent" icon={<LightbulbIcon />} title="The takeaway">
        Two of eleven gold rules made a profit in the final test; <strong>none</strong> held up in both metals.
      </Callout>
      <Callout icon={<InfoIcon />} title="How the test was run">
        One mini lot per trade, after charges and a harsher assumed execution cost.
      </Callout>
      <Callout tone="warning" icon={<TriangleAlertIcon />} title="Do not use the combined result">
        Its test used later information, so its profit claims are withdrawn.
      </Callout>
      <div className="grid gap-3 sm:grid-cols-2">
        <Callout tone="positive" icon={<TrendingUpIcon />} title="Best rule">
          A failed range break reverses: <strong>▲₹10,616</strong>.
        </Callout>
        <Callout tone="negative" icon={<TrendingDownIcon />} title="Worst rule">
          Break the first-hour range: <strong>▼₹70,679</strong>.
        </Callout>
      </div>
      <Quote source="eMudhra's incident notice, 21 Oct 2026">
        The affected intermediate keys were generated with insufficient entropy and have been revoked.
      </Quote>
      <WarningAlert>
        <AlertTitle>Ledger history is incomplete</AlertTitle>
        <AlertDescription>Dhan's cash ledger starts in April 2024; earlier flows are missing.</AlertDescription>
      </WarningAlert>
    </div>
  );
}
