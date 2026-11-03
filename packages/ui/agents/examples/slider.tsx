import { Slider } from "@siyahi/ui";

export default function SliderExample() {
  return <Slider defaultValue={[20, 80]} max={100} step={5} aria-label="Allocation band" className="max-w-sm" />;
}
