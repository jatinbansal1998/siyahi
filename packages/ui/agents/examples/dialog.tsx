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
      <DialogTrigger render={<Button variant="outline" className="w-fit" />}>Show fills</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fills for this sell</DialogTitle>
          <DialogDescription>Each lot this sale was matched against, oldest first.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
