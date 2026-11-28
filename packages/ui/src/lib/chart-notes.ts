import type {
  AutoscaleInfo,
  IChartApiBase,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from "lightweight-charts";

/** A note at one point of a series, such as a results day: its text, and the time and price it points at. */
export interface ChartNote {
  time: Time;
  price: number;
  text: string;
}

type Target = Parameters<IPrimitivePaneRenderer["draw"]>[0];

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A note's text where it was written, and the leader down from it to its arrow at `x`, ending at `tip`. */
interface Written extends Box {
  x: number;
  tip: number;
}

// Pixels. A note is an arrow pointing down at its point, with its text above.
const ARROW = 5;
const ARROW_HALF_WIDTH = 3.5;
/** Between the line and the arrow, between the arrow and the text, and between a leader and another note's text. */
const CLEAR = 3;
/** Between two notes' texts side by side, so two notes never read as one. */
const SPACE = 8;
/** Between two notes' texts stacked. */
const ROW = 2;
/** How far a text that starts or ends at its arrow reaches past it. */
const INSET = 6;

/**
 * Where a note's text goes: as low as it can over its arrow at `x`, with its whole width above everything drawn
 * under it (`ceiling`) and clear of the texts and leaders written before it. Centred on the arrow, or starting or
 * ending at it, whichever sits lowest, so a text on a slope leans to its lower side. Undefined when every place is
 * above `top` or its leader would cross a text.
 */
function place(
  x: number,
  tip: number,
  width: number,
  height: number,
  plot: { top: number; width: number },
  written: Written[],
  ceiling: (left: number, right: number) => number,
): Written | undefined {
  const lefts = [x - width / 2, x - INSET, x + INSET - width];
  const places = lefts.flatMap((at) => {
    const left = Math.min(Math.max(at, 0), plot.width - width);
    const right = left + width;
    let bottom = ceiling(left, right) - 2 * CLEAR - ARROW;
    // Another text, or the leader under it, in the way: climb over that text.
    const overlaps = (other: Written) =>
      other.left < right + SPACE &&
      left < other.right + SPACE &&
      other.top < bottom + ROW &&
      bottom - height < other.bottom + ROW;
    const onLeader = (other: Written) =>
      other.x > left - CLEAR && other.x < right + CLEAR && bottom - height < other.tip && bottom > other.bottom;
    const meets = (other: Written) => overlaps(other) || onLeader(other);
    for (let over = written.find(meets); over; over = written.find(meets)) bottom = over.top - ROW;
    const crossed = written.some(
      (other) => other.left - CLEAR < x && x < other.right + CLEAR && other.top < tip && other.bottom > bottom,
    );
    return left < 0 || bottom - height < plot.top || crossed
      ? []
      : [{ left, right, top: bottom - height, bottom, x, tip }];
  });
  return places.reduce<Written | undefined>(
    (best, next) => (best && best.bottom >= next.bottom ? best : next),
    undefined,
  );
}

/**
 * Notes over the series of one pane, attached to its first. Each note's text sits above everything drawn under its
 * whole width, not only its own point, and inside the plot, below the pane's legend. A note that would crowd one
 * already placed climbs over it; one left with no room keeps its arrow, and is handed to `onCrowded` for the page to
 * write out.
 */
export class ChartNotes implements ISeriesPrimitive<Time> {
  private chart: IChartApiBase<Time> | null = null;
  private requestUpdate = () => {};
  private notes: ChartNote[] = [];
  private color = "";
  /** The legend's bottom: no text goes above it. */
  private top = 0;
  /** The crowded notes last handed on, so a redraw that crowds the same ones says nothing. */
  private crowded = "";
  private readonly views: IPrimitivePaneView[] = [
    { renderer: () => ({ draw: (target: Target) => target.useMediaCoordinateSpace((scope) => this.draw(scope)) }) },
  ];

  constructor(
    /** Every series in the pane: a note's text keeps clear of them all. */
    private readonly series: ISeriesApi<SeriesType>[],
    private readonly onCrowded: (notes: ChartNote[]) => void,
  ) {}

  attached({ chart, requestUpdate }: SeriesAttachedParameter<Time>) {
    this.chart = chart;
    this.requestUpdate = requestUpdate;
  }

  detached() {
    this.chart = null;
  }

  set(notes: ChartNote[], color: string, top: number) {
    this.notes = notes;
    this.color = color;
    this.top = top;
    this.requestUpdate();
  }

  paneViews() {
    return this.views;
  }

  /**
   * Room above the highest point for one note's arrow and text, so a note there is not crowded out, and a pixel more
   * for the library's rounding of each point to the pixel grid.
   */
  autoscaleInfo(): AutoscaleInfo | null {
    if (!this.notes.length || !this.chart) return null;
    const above = this.chart.options().layout.fontSize + ARROW + 2 * CLEAR + 1;
    return { priceRange: null, margins: { above, below: 0 } };
  }

  private draw({ context, mediaSize }: { context: CanvasRenderingContext2D; mediaSize: { width: number } }) {
    if (!this.chart) return;
    const { fontSize, fontFamily } = this.chart.options().layout;
    const timeScale = this.chart.timeScale();
    const spacing = timeScale.options().barSpacing;
    // Every point drawn in the pane, as the top of what the series draws there.
    const drawn = this.series.flatMap((series) =>
      series.data().flatMap((item) => {
        const price = "high" in item ? item.high : "value" in item ? item.value : undefined;
        const x = timeScale.timeToCoordinate(item.time);
        const y = price === undefined ? null : series.priceToCoordinate(price);
        return x === null || y === null ? [] : [{ x, y }];
      }),
    );
    // The highest point drawn from `left` to `right`, taking the points a bar either side, which the line runs to.
    const ceiling = (left: number, right: number) =>
      Math.min(...drawn.filter(({ x }) => x >= left - spacing && x <= right + spacing).map(({ y }) => y));
    context.font = `${fontSize}px ${fontFamily}`;
    context.textBaseline = "top";
    context.fillStyle = this.color;
    const written: Written[] = [];
    const unwritten = new Set<ChartNote>();
    // The shortest first, so a long note crowds out no more than itself.
    const width = (note: ChartNote) => context.measureText(note.text).width;
    for (const note of this.notes.toSorted((a, b) => width(a) - width(b))) {
      const x = timeScale.timeToCoordinate(note.time);
      const y = this.series[0]?.priceToCoordinate(note.price) ?? null;
      if (x === null || y === null || x < 0 || x > mediaSize.width) continue;
      const tip = y - CLEAR - ARROW;
      context.beginPath();
      context.moveTo(x - ARROW_HALF_WIDTH, tip);
      context.lineTo(x + ARROW_HALF_WIDTH, tip);
      context.lineTo(x, y - CLEAR);
      context.fill();
      const placed = place(x, tip, width(note), fontSize, { top: this.top, width: mediaSize.width }, written, ceiling);
      if (!placed) {
        unwritten.add(note);
        continue;
      }
      written.push(placed);
      context.fillText(note.text, placed.left, placed.top);
      // A text lifted off its arrow, over the line beside it or another note, is tied to it by a hairline.
      if (placed.bottom < tip - CLEAR) {
        context.fillRect(Math.round(x - 0.5), placed.bottom + 1, 1, tip - placed.bottom - 1);
      }
    }
    const crowded = this.notes.filter((note) => unwritten.has(note));
    const key = crowded.map(({ text, price }) => `${text}@${price}`).join("|");
    if (key === this.crowded) return;
    this.crowded = key;
    this.onCrowded(crowded);
  }
}
