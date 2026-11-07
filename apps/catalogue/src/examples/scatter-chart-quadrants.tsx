import { ScatterChartCard, useFormat, type ScatterPoint } from "@siyahi/ui";

// A grocer's products this quarter against last: x is the change in shelf price, y the change in units sold, and
// size the quarter's revenue; made-up figures. Largest first, so the biggest sellers take the labels.
const products: ScatterPoint[] = [
  { name: "Basmati rice 5 kg", x: 0.06, y: -0.04, size: 1_840_000 },
  { name: "Sunflower oil 1 L", x: -0.08, y: 0.12, size: 1_520_000 },
  { name: "Full-cream milk", x: 0.03, y: 0.05, size: 1_310_000 },
  { name: "Atta 10 kg", x: 0.04, y: -0.09, size: 1_120_000 },
  { name: "Tea 500 g", x: -0.02, y: 0.08, size: 760_000 },
  { name: "Paneer 200 g", x: 0.09, y: 0.11, size: 640_000 },
  { name: "Toor dal 1 kg", x: 0.12, y: -0.18, size: 590_000 },
  { name: "Biscuits family pack", x: -0.05, y: -0.03, size: 420_000 },
  { name: "Instant noodles", x: 0.01, y: 0.21, size: 380_000 },
  { name: "Dish soap", x: -0.1, y: -0.07, size: 260_000 },
  { name: "Ghee 500 ml", x: 0.07, y: 0.02, size: 240_000 },
  { name: "Coffee 200 g", x: -0.04, y: 0.15, size: 190_000 },
];

export default function ScatterChartQuadrantsExample() {
  const { moneyCompact, pct } = useFormat();
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${pct(Math.abs(value))}`;
  return (
    <ScatterChartCard
      title="Products by price and sales"
      description="This quarter against last. Across is the change in shelf price, up the change in units sold; a dot's area is the quarter's revenue."
      points={products}
      height={380}
      xLabel="Change in price"
      yLabel="Change in units sold"
      xFormatter={signed}
      yFormatter={signed}
      sizeLabel="Revenue"
      sizeFormatter={(value) => moneyCompact(value)}
      quadrants={{
        x: 0,
        y: 0,
        labels: {
          topLeft: "Cheaper, selling more",
          topRight: "Dearer, still selling more",
          bottomLeft: "Cheaper, selling less",
          bottomRight: "Dearer, selling less",
        },
      }}
    />
  );
}
