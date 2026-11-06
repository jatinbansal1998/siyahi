import { Callout, Quote, WarningAlert, AlertDescription, AlertTitle } from "@siyahi/ui";
import { LightbulbIcon, InfoIcon, TriangleAlertIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

export default function CalloutExample() {
  return (
    <div className="grid max-w-2xl gap-3">
      <Callout tone="accent" icon={<LightbulbIcon />} title="The takeaway">
        Two of eleven pricing tests raised revenue; <strong>none</strong> held up in both regions.
      </Callout>
      <Callout icon={<InfoIcon />} title="How the tests were run">
        Four weeks each on a random tenth of new visitors, with refunds and payment fees taken off.
      </Callout>
      <Callout tone="warning" icon={<TriangleAlertIcon />} title="Do not use the combined result">
        It counted orders placed before the test began, so its revenue claims are withdrawn.
      </Callout>
      <div className="grid gap-3 sm:grid-cols-2">
        <Callout tone="positive" icon={<TrendingUpIcon />} title="Best test">
          Annual plan shown first: <strong>▲₹10,616</strong> a week.
        </Callout>
        <Callout tone="negative" icon={<TrendingDownIcon />} title="Worst test">
          Free delivery only above ₹999: <strong>▼₹70,679</strong> a week.
        </Callout>
      </div>
      <Quote source="The hosting provider's incident report, 21 Oct 2026">
        Requests to the Mumbai region failed for 42 minutes after a configuration change, which has been rolled back.
      </Quote>
      <WarningAlert>
        <AlertTitle>Order history is incomplete</AlertTitle>
        <AlertDescription>The old shop's export starts in April 2024; earlier orders are missing.</AlertDescription>
      </WarningAlert>
    </div>
  );
}
