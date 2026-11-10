import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@siyahi/ui";
import { IndianRupeeIcon } from "lucide-react";

const kinds = [
  { value: "equity", label: "Equity" },
  { value: "debt", label: "Debt" },
  { value: "gold", label: "Gold" },
];

// Each field is a Field: its label above (small mono capitals, from the theme), the control, and a hint or an error.
export default function FieldExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a holding</CardTitle>
        <CardDescription>What you bought, how much, and how often to review it</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid max-w-3xl gap-x-8 gap-y-5 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <Field>
            <FieldLabel htmlFor="holding-name">Name</FieldLabel>
            <Input id="holding-name" defaultValue="Nifty Next 50 index fund" />
            <FieldDescription>As it appears on the statement</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="holding-kind">Kind</FieldLabel>
            <Select items={kinds} defaultValue="equity">
              <SelectTrigger id="holding-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {kinds.map((kind) => (
                    <SelectItem key={kind.value} value={kind.value}>
                      {kind.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="holding-amount">Amount invested</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <IndianRupeeIcon />
              </InputGroupAddon>
              <InputGroupInput id="holding-amount" defaultValue="2,50,000" inputMode="numeric" />
            </InputGroup>
            <FieldDescription>In rupees, before charges</FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="holding-folio">Folio number</FieldLabel>
            <Input id="holding-folio" defaultValue="9103-44" aria-invalid aria-describedby="holding-folio-error" />
            <FieldError id="holding-folio-error">A folio number is 8 to 12 digits, such as 91034455</FieldError>
          </Field>
          <Field>
            <FieldLabel id="holding-review">Review</FieldLabel>
            <ToggleGroup defaultValue={["quarterly"]} variant="outline" aria-labelledby="holding-review">
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="quarterly">Quarterly</ToggleGroupItem>
              <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor="holding-account">Account</FieldLabel>
            <Input id="holding-account" defaultValue="Demat, joint" disabled />
            <FieldDescription>Set by the statement you imported</FieldDescription>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="holding-note">Note</FieldLabel>
            <Textarea id="holding-note" placeholder="Why you bought it, and what would make you sell" />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">Save holding</Button>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
