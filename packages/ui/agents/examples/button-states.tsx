import { Button, Toggle } from "@siyahi/ui";
import { DownloadIcon, Loader2Icon, PinIcon } from "lucide-react";

export default function ButtonStatesExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled>Save</Button>
      <Button variant="outline" disabled>
        <DownloadIcon />
        Export
      </Button>
      {/* Busy: the label stays and the icon spins, so the button keeps its width while the work runs. */}
      <Button disabled aria-busy>
        <Loader2Icon className="motion-safe:animate-spin" />
        Saving
      </Button>
      <Toggle variant="outline" defaultPressed aria-label="Pin to top">
        <PinIcon />
        Pinned
      </Toggle>
    </div>
  );
}
