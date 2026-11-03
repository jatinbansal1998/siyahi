import { Alert, AlertDescription, AlertTitle } from "@siyahi/ui";
import { CircleAlertIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";

export default function AlertExample() {
  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>Prices are delayed</AlertTitle>
        <AlertDescription>Quotes refresh every fifteen minutes during market hours.</AlertDescription>
      </Alert>
      <Alert>
        {/* Alert sets its icons to the text colour with a stronger selector; the ! lets the icon's colour win. */}
        <TriangleAlertIcon className="text-warning!" />
        <AlertTitle>Two trades are unmatched</AlertTitle>
        <AlertDescription>The contract notes list trades the ledger does not have yet.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>The statement could not be read. Download it again and retry.</AlertDescription>
      </Alert>
    </div>
  );
}
