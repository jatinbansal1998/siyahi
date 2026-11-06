import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@siyahi/ui";

export default function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="w-fit" />}>Show parcels</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parcels for this order</DialogTitle>
          <DialogDescription>Each parcel this order was split into, earliest first.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
