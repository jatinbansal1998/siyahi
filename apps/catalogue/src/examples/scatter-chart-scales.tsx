import { ScatterChartCard, useFormat, type ScatterPoint } from "@siyahi/ui";

// A shop's products this month: x is units sold, y the shelf price; made-up figures. Both run from a few to
// thousands, so both axes open on log. Largest sellers first, so they take the labels.
const products: ScatterPoint[] = [
  { name: "Milk 500 ml", x: 38000, y: 32 },
  { name: "Bread", x: 21000, y: 45 },
  { name: "Eggs, 6", x: 14500, y: 60 },
  { name: "Tea 250 g", x: 6200, y: 140 },
  { name: "Atta 5 kg", x: 4800, y: 260 },
  { name: "Rice 5 kg", x: 3900, y: 420 },
  { name: "Oil 1 L", x: 3100, y: 180 },
  { name: "Ghee 500 ml", x: 1400, y: 340 },
  { name: "Coffee 200 g", x: 900, y: 480 },
  { name: "Dry fruit box", x: 260, y: 1200 },
  { name: "Saffron 1 g", x: 120, y: 350 },
  { name: "Olive oil 1 L", x: 95, y: 980 },
  { name: "Gift hamper", x: 40, y: 3500 },
  { name: "Mixer grinder", x: 18, y: 4200 },
  { name: "Pressure cooker", x: 25, y: 2100 },
];

export default function ScatterChartScalesExample() {
  const { count, money } = useFormat();
  return (
    <ScatterChartCard
      title="A few cheap products sell most of the units"
      description="Units sold this month against shelf price. Both axes switch: each pair of buttons is named for its axis."
      points={products}
      height={360}
      xLabel="Units sold"
      yLabel="Price"
      xScale="log"
      xScaleToggle
      yScale="log"
      yScaleToggle
      xFormatter={count}
      yFormatter={(value) => money(value)}
      quadrants={{
        x: 1000,
        y: 500,
        labels: { topLeft: "Dear, few sold", bottomRight: "Cheap, many sold" },
      }}
    />
  );
}
