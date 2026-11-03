import { Input, InputGroup, InputGroupAddon, InputGroupInput, Textarea } from "@siyahi/ui";
import { SearchIcon } from "lucide-react";

export default function InputExample() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Input placeholder="Folio number" aria-label="Folio number" />
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search symbols" aria-label="Search symbols" />
      </InputGroup>
      <Textarea placeholder="Note for this trade" aria-label="Note" />
    </div>
  );
}
