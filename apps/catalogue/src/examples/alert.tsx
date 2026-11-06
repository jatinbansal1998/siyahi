import { Alert, AlertDescription, AlertTitle, WarningAlert } from "@siyahi/ui";
import { CircleAlertIcon, InfoIcon } from "lucide-react";

export default function AlertExample() {
  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>Figures are delayed</AlertTitle>
        <AlertDescription>Sales figures refresh every fifteen minutes during opening hours.</AlertDescription>
      </Alert>
      <WarningAlert>
        <AlertTitle>Two payments are unmatched</AlertTitle>
        <AlertDescription>The bank statement lists payments no order accounts for yet.</AlertDescription>
      </WarningAlert>
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>The CSV could not be read. Export it again and retry.</AlertDescription>
      </Alert>
    </div>
  );
}
