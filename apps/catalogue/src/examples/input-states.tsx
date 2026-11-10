import { Field, FieldDescription, FieldError, FieldLabel, Input } from "@siyahi/ui";

// A field is its label, the input and one line under it: a hint, or the error that replaces it.
export default function InputStatesExample() {
  return (
    <div className="grid max-w-sm gap-5">
      <Field>
        <FieldLabel htmlFor="budget">Monthly budget</FieldLabel>
        <Input id="budget" inputMode="numeric" defaultValue="25,000" aria-describedby="budget-hint" />
        <FieldDescription id="budget-hint">In rupees, before tax</FieldDescription>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="pin">PIN code</FieldLabel>
        <Input id="pin" defaultValue="56/001" aria-invalid aria-describedby="pin-error" />
        <FieldError id="pin-error">A PIN code is six digits, such as 560001</FieldError>
      </Field>
      <Field data-disabled>
        <FieldLabel htmlFor="team">Team</FieldLabel>
        <Input id="team" defaultValue="Finance" disabled />
      </Field>
    </div>
  );
}
