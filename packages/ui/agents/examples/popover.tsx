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
      <PopoverTrigger render={<Button variant="outline" className="w-fit" />}>How is this priced?</PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Last close</PopoverTitle>
          <PopoverDescription>Holdings are valued at the exchange's last closing price.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
