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
          In rupees, before brokerage
        </p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="folio" className="text-sm font-medium">
          Folio number
        </label>
        <Input id="folio" defaultValue="12/34" aria-invalid aria-describedby="folio-error" />
        <p id="folio-error" className="text-sm text-destructive">
          A folio is digits only, such as 1234567
        </p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="broker" className="text-sm font-medium text-muted-foreground">
          Broker
        </label>
        <Input id="broker" defaultValue="Kite" disabled />
      </div>
    </div>
  );
}
