import {
  Button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@siyahi/ui";

export default function PopoverExample() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="w-fit" />}>How is this counted?</PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Paid orders</PopoverTitle>
          <PopoverDescription>Revenue counts paid orders, less refunds, on the day each was placed.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
