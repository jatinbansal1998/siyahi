import { AlertDescription, AlertTitle, StatusAlert } from "@siyahi/ui";

export default function AlertExample() {
  return (
    <div className="flex flex-col gap-3">
      <StatusAlert>
        <AlertTitle>Figures are delayed</AlertTitle>
        <AlertDescription>Sales figures refresh every fifteen minutes during opening hours.</AlertDescription>
      </StatusAlert>
      <StatusAlert tone="warning">
        <AlertTitle>Two payments are unmatched</AlertTitle>
        <AlertDescription>The bank statement lists payments no order accounts for yet.</AlertDescription>
      </StatusAlert>
      <StatusAlert tone="negative">
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>The CSV could not be read. Export it again and retry.</AlertDescription>
      </StatusAlert>
      <StatusAlert tone="positive">
        <AlertTitle>Refunds are settled</AlertTitle>
        <AlertDescription>All 14 refunds from last week have reached the customers' accounts.</AlertDescription>
      </StatusAlert>
    </div>
  );
}
