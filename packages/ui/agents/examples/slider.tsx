import { Slider } from "@siyahi/ui";

export default function SliderExample() {
  return <Slider defaultValue={[20, 80]} max={100} step={5} aria-label="Price range" className="max-w-sm" />;
}
