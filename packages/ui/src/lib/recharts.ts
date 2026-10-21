// The Recharts pieces chart compositions need, from the same copy of Recharts
// that ChartContainer uses, so a page never installs a second one.
// 2026-10-21: kept until dash pages move to BarChartCard, AreaChartCard and
// LineChartCard; remove after (see CHANGELOG 0.1.8).
export { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
