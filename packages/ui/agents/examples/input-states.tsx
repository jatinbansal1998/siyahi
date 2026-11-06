import { Input } from "@siyahi/ui";

// A field is its label, the input and one line under it: a hint, or the error that replaces it.
export default function InputStatesExample() {
  return (
    <div className="grid max-w-sm gap-5">
      <div className="grid gap-1.5">
        <label htmlFor="budget" className="text-sm font-medium">
          Monthly budget
        </label>
        <Input id="budget" inputMode="numeric" defaultValue="25,000" aria-describedby="budget-hint" />
        <p id="budget-hint" className="text-sm text-muted-foreground">
          In rupees, before tax
        </p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="pin" className="text-sm font-medium">
          PIN code
        </label>
        <Input id="pin" defaultValue="56/001" aria-invalid aria-describedby="pin-error" />
        <p id="pin-error" className="text-sm text-destructive">
          A PIN code is six digits, such as 560001
        </p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="team" className="text-sm font-medium text-muted-foreground">
          Team
        </label>
        <Input id="team" defaultValue="Finance" disabled />
      </div>
    </div>
  );
}
