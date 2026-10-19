import { Button } from "@siyahi/ui";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";

export default function ButtonExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Save</Button>
      <Button variant="outline">
        <DownloadIcon />
        Export
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Link</Button>
      <Button variant="outline" size="icon" aria-label="Refresh">
        <RefreshCwIcon />
      </Button>
    </div>
  );
}
