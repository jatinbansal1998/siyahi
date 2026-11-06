import { Input, InputGroup, InputGroupAddon, InputGroupInput, Textarea } from "@siyahi/ui";
import { SearchIcon } from "lucide-react";

export default function InputExample() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Input placeholder="Order number" aria-label="Order number" />
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search customers" aria-label="Search customers" />
      </InputGroup>
      <Textarea placeholder="Note for this order" aria-label="Note" />
    </div>
  );
}
