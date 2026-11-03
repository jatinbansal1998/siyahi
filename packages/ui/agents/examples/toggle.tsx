import { Toggle } from "@siyahi/ui";
import { EyeOffIcon } from "lucide-react";

export default function ToggleExample() {
  return (
    <Toggle variant="outline" aria-label="Hide amounts">
      <EyeOffIcon />
      Hide amounts
    </Toggle>
  );
}
