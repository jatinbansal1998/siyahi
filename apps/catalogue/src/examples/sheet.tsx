import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@siyahi/ui";

export default function SheetExample() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" className="w-fit" />}>Filters</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the ledger by account, symbol or date.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
