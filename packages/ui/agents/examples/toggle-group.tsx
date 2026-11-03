import { ToggleGroup, ToggleGroupItem } from "@siyahi/ui";

export default function ToggleGroupExample() {
  return (
    <ToggleGroup defaultValue={["1Y"]} variant="outline" size="sm" aria-label="Range">
      <ToggleGroupItem value="1M">1M</ToggleGroupItem>
      <ToggleGroupItem value="6M">6M</ToggleGroupItem>
      <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
      <ToggleGroupItem value="All">All</ToggleGroupItem>
    </ToggleGroup>
  );
}
