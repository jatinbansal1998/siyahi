// The TimeSeriesChart example in Chromium: Lightweight Charts lays its panes out and moves its crosshair on real
// pointer events, which happy-dom has neither of.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/time-series-chart");
  page = catalogue.page;
  // The examples load before their charts draw; with other suites' browsers running, a chart can take seconds.
  for (const drawn of await page
    .locator('[data-slot="time-series-chart"]:not(:has([data-slot="chart-placeholder"]))')
    .all()) {
    await drawn.locator("table tr").first().waitFor({ state: "attached", timeout: 30_000 });
  }
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** The page's chart cards, in the order of its examples: panes, price, candles, live, then stale and loading. */
const card = (index: number) =>
  page
    .locator("main [data-slot=card]")
    .filter({ has: page.locator('[data-slot="time-series-chart"]') })
    .nth(index);
const plot = (index: number) => card(index).locator('[data-slot="time-series-chart"]');
const chart = () => plot(0);
const legends = () => chart().locator('[data-slot="time-series-chart-legend"]');
/** Each pane's legend as [label, value] pairs, top pane first. */
const legendValues = (index = 0) =>
  plot(index)
    .locator('[data-slot="time-series-chart-legend"]')
    .evaluateAll((lists) =>
      lists.map((list) => [...list.querySelectorAll("li")].map((item) => item.innerText.split("\n"))),
    );
/** Everything the chart drew, as pixels. */
const pixels = (index: number) =>
  plot(index)
    .locator("canvas")
    .evaluateAll((canvases) => canvases.map((canvas) => (canvas as HTMLCanvasElement).toDataURL()).join());
const pressed = (index: number) => card(index).locator('[aria-pressed="true"]').allInnerTexts();

/** A label the chart wrote on an axis, in the axis canvas's pixels, centred on `x` and `y`. */
interface AxisLabel {
  axis: "price" | "time";
  pane: number;
  text: string;
  x: number;
  y: number;
  width: number;
  canvasWidth: number;
}

/** Every label a chart writes on its axes when it next draws in full, as it does after a resize. */
async function axisLabels(index = 0): Promise<AxisLabel[]> {
  await page.mouse.move(0, 0);
  await plot(index).evaluate(() => {
    // Each label in its canvas's bitmap pixels, as the canvas's transform places it when written.
    const drawn: { canvas: HTMLCanvasElement; text: string; x: number; y: number; width: number }[] = [];
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (this: CanvasRenderingContext2D, text, x, y, ...rest) {
      const { a, d, e, f } = this.getTransform();
      drawn.push({ canvas: this.canvas, text, x: a * x + e, y: d * y + f, width: a * this.measureText(text).width });
      fillText.call(this, text, x, y, ...rest);
    };
    Object.assign(window, { drawn, fillText });
  });
  const viewport = page.viewportSize() ?? { width: 1280, height: 900 };
  await page.setViewportSize({ ...viewport, width: viewport.width + 1 });
  await page.waitForTimeout(300);
  await page.setViewportSize(viewport);
  await page.waitForTimeout(300);
  return plot(index).evaluate((root) => {
    const { drawn, fillText } = window as unknown as {
      drawn: { canvas: HTMLCanvasElement; text: string; x: number; y: number; width: number }[];
      fillText: CanvasRenderingContext2D["fillText"];
    };
    CanvasRenderingContext2D.prototype.fillText = fillText;
    const rows = [...root.querySelectorAll("table tr")];
    const timeRow = rows.at(-1);
    const panes = rows.filter((row) => row !== timeRow && row.clientHeight > 1);
    // A draw at each width writes every label; a label written twice in one place is one label.
    const labels = new Map(drawn.map((label) => [`${label.text}@${label.x},${label.y}`, label]));
    return [...labels.values()].flatMap(({ canvas, text, x, y, width }): AxisLabel[] => {
      const row = canvas.closest("tr");
      const cell = canvas.closest("td");
      if (!text || !row || !cell) return [];
      const ratio = canvas.width / canvas.clientWidth;
      const label = { text, x: x / ratio, y: y / ratio, width: width / ratio, canvasWidth: canvas.clientWidth };
      // The time axis is the bottom row's widest cell; a price axis, the last cell of a pane's row.
      const cells = [...row.children];
      const widest = cells.reduce((wide, next) => (next.clientWidth > wide.clientWidth ? next : wide));
      if (row === timeRow && cell === widest) return [{ axis: "time", pane: -1, ...label }];
      if (panes.includes(row) && cell === cells.at(-1)) return [{ axis: "price", pane: panes.indexOf(row), ...label }];
      return [];
    });
  });
}

/** A note's text as a chart wrote it on its first pane, in CSS pixels from the pane's top left. */
interface NoteText {
  text: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * What a chart draws on its first pane at its final width, after a resize: the notes' texts, the lines it strokes 2px
 * or wider (its series; gridlines and levels are 1px) as lists of points, the pane's width and its legend's bottom.
 */
async function paneDrawing(index: number, texts: string[]) {
  await page.mouse.move(0, 0);
  const viewport = page.viewportSize() ?? { width: 1280, height: 900 };
  await page.setViewportSize({ ...viewport, width: viewport.width + 1 });
  await page.waitForTimeout(300);
  await plot(index).evaluate(() => {
    type Point = [number, number];
    const drawn: { canvas: HTMLCanvasElement; text: string; box: number[] }[] = [];
    const strokes: { canvas: HTMLCanvasElement; points: Point[] }[] = [];
    let path: Point[][] = [];
    const proto = CanvasRenderingContext2D.prototype;
    const original = {
      fillText: proto.fillText,
      beginPath: proto.beginPath,
      moveTo: proto.moveTo,
      lineTo: proto.lineTo,
      stroke: proto.stroke,
    };
    proto.fillText = function (this: CanvasRenderingContext2D, text, x, y, ...rest) {
      const { a, d, e, f } = this.getTransform();
      const size = this.measureText(text);
      const top = y - size.actualBoundingBoxAscent;
      const bottom = y + size.actualBoundingBoxDescent;
      drawn.push({
        canvas: this.canvas,
        text,
        box: [a * x + e, a * (x + size.width) + e, d * top + f, d * bottom + f],
      });
      original.fillText.call(this, text, x, y, ...rest);
    };
    proto.beginPath = function (this: CanvasRenderingContext2D) {
      path = [];
      original.beginPath.call(this);
    };
    proto.moveTo = function (this: CanvasRenderingContext2D, x, y) {
      const { a, d, e, f } = this.getTransform();
      path.push([[a * x + e, d * y + f]]);
      original.moveTo.call(this, x, y);
    };
    proto.lineTo = function (this: CanvasRenderingContext2D, x, y) {
      const { a, d, e, f } = this.getTransform();
      path.at(-1)?.push([a * x + e, d * y + f]);
      original.lineTo.call(this, x, y);
    };
    proto.stroke = function (this: CanvasRenderingContext2D, shape?: Path2D) {
      const ratio = this.canvas.width / this.canvas.clientWidth;
      if (this.lineWidth * this.getTransform().a >= 2 * ratio) {
        strokes.push(...path.map((points) => ({ canvas: this.canvas, points })));
      }
      Reflect.apply(original.stroke, this, shape ? [shape] : []);
    };
    Object.assign(window, { drawn, strokes, original });
  });
  await page.setViewportSize(viewport);
  await page.waitForTimeout(300);
  return plot(index).evaluate((root, names) => {
    type Point = [number, number];
    const { drawn, strokes, original } = window as unknown as {
      drawn: { canvas: HTMLCanvasElement; text: string; box: number[] }[];
      strokes: { canvas: HTMLCanvasElement; points: Point[] }[];
      original: Record<string, unknown>;
    };
    Object.assign(CanvasRenderingContext2D.prototype, original);
    // The first pane's plot is the widest cell of the layout's first row.
    const cells = [...(root.querySelector("table tr")?.children ?? [])];
    const cell = cells.reduce((wide, next) => (next.clientWidth > wide.clientWidth ? next : wide));
    const inPane = ({ canvas }: { canvas: HTMLCanvasElement }) => canvas.closest("td") === cell;
    // Bitmap pixels to CSS pixels.
    const css = (value: number) => (value / (cell.querySelector("canvas")?.width ?? 1)) * cell.clientWidth;
    const written = new Map(
      drawn
        .filter((item) => inPane(item) && names.includes(item.text))
        .map(({ text, box: [left = 0, right = 0, top = 0, bottom = 0] }) => {
          const at = { text, left: css(left), right: css(right), top: css(top), bottom: css(bottom) };
          return [`${text}@${left},${top}`, at];
        }),
    );
    const legend = root.querySelector<HTMLElement>('[data-slot="time-series-chart-legend"]');
    return {
      texts: [...written.values()],
      lines: strokes.filter(inPane).map(({ points }) => points.map(([x, y]): Point => [css(x), css(y)])),
      width: cell.clientWidth,
      legendBottom: (legend?.offsetTop ?? 0) + (legend?.offsetHeight ?? 0),
    };
  }, texts);
}

/** Whether a line from `a` to `b` passes through a note's text, walked a pixel at a time. */
function crosses(text: NoteText, [ax, ay]: [number, number], [bx, by]: [number, number]): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
  return Array.from({ length: steps + 1 }, (_, step) => step / steps).some((t) => {
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    // The line is 2px wide: a pixel either side of its path.
    return x > text.left && x < text.right && y > text.top - 1 && y < text.bottom + 1;
  });
}

/** The plot's box on screen, after scrolling it into view. */
async function box(index: number) {
  await plot(index).scrollIntoViewIfNeeded();
  const bounds = await plot(index).boundingBox();
  if (!bounds) throw new Error("not laid out");
  return bounds;
}

/** The first series' value under a point `x` pixels into the plot: what the reader sees there. */
async function valueAt(index: number, x: number): Promise<string | undefined> {
  const { x: left, y: top } = await box(index);
  // Off and back on, so the crosshair reads the plot as it is now.
  await page.mouse.move(left + x, top - 30);
  await page.mouse.move(left + x, top + 60);
  await page.waitForTimeout(100);
  return (await legendValues(index))[0]?.[0]?.[1];
}

describe("TimeSeriesChart", { timeout: 60_000 }, () => {
  it("draws each pane at the height the page gives it, over one time axis, with its legend at its top", async () => {
    // The library lays out a table: a row per pane, a 1px divider between them, and the time axis last.
    await expect
      .poll(() =>
        chart()
          .locator("table tr")
          .evaluateAll((rows) => rows.map((row) => row.clientHeight)),
      )
      .toEqual([180, 1, 120, 1, 120, 28]);
    expect(await legends().evaluateAll((lists) => lists.map((list) => (list as HTMLElement).offsetTop))).toEqual([
      4, 185, 306,
    ]);
  });

  it("gives every line's latest value, the hovered date's in every pane, and the latest again off the chart", async () => {
    await expect.poll(async () => (await legendValues())[2]?.[1]?.[1]).toBe("62%");
    const latest = await legendValues();
    expect(latest).toEqual([
      [["Nifty 50 close", "25,820"]],
      [
        ["Foreign net contracts", "−59,476"],
        ["Retail net contracts", "+46,955"],
      ],
      [
        ["Foreign share long", "30%"],
        ["Retail share long", "62%"],
      ],
    ]);
    const { x, y, width } = await box(0);
    // In the bottom pane, a third of the way along: every pane's legend follows the one crosshair.
    await page.mouse.move(x + width / 3, y + 360);
    await expect.poll(async () => (await legendValues())[0]?.[0]?.[1]).not.toBe("25,820");
    const hovered = (await legendValues()).flat();
    for (const [index, [label, value]] of hovered.entries()) {
      expect(value, label).not.toBe(latest.flat()[index]?.[1]);
    }
    await page.mouse.move(x + width / 3, y - 40);
    await expect.poll(() => legendValues()).toEqual(latest);
  });

  it("shows the picked range up to the last point, and no range once the reader zooms by hand", async () => {
    expect(await pressed(0)).toEqual(["All"]);
    const whole = await valueAt(0, 200);
    await card(0).getByRole("button", { name: "1M" }).click();
    await expect.poll(() => pressed(0)).toEqual(["1M"]);
    // 250 sessions fill the plot on All; a month of them puts a later, higher close under the same point.
    await expect.poll(() => valueAt(0, 200)).not.toBe(whole);
    const { x, y } = await box(0);
    await page.mouse.move(x + 300, y + 60);
    await page.mouse.down();
    await page.mouse.move(x + 500, y + 60, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => pressed(0)).toEqual([]);
    await card(0).getByRole("button", { name: "All" }).click();
    await expect.poll(() => valueAt(0, 200)).toBe(whole);
  });

  it("leaves the wheel to the page until the reader clicks into the chart", async () => {
    const { x, y } = await box(0);
    const scrolled = () => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
    const before = await valueAt(0, 500);
    const top = await scrolled();
    await page.mouse.wheel(0, 100);
    await expect.poll(scrolled).toBe(top + 100);
    await page.mouse.wheel(0, -100);
    await expect.poll(scrolled).toBe(top);
    expect(await valueAt(0, 500)).toBe(before);
    await page.mouse.move(x + 200, y + 60);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.wheel(0, -300);
    await expect.poll(() => valueAt(0, 500)).not.toBe(before);
    expect(await scrolled()).toBe(top);
    await card(0).getByRole("button", { name: "All" }).click();
  });

  it("opens on the page's range and draws the first pane on a log axis when the reader picks Log", async () => {
    await expect.poll(() => pressed(1)).toEqual(["1Y", "Linear"]);
    await card(1).getByRole("button", { name: "All" }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    const linear = await pixels(1);
    await card(1).getByRole("button", { name: "Log" }).click();
    await expect.poll(() => pixels(1)).not.toBe(linear);
  });

  it("writes a candlestick's open, high, low and close in its legend", async () => {
    await expect
      .poll(() => legendValues(2))
      .toEqual([
        [["Price", "O ₹1,664 H ₹1,684 L ₹1,640 C ₹1,656"]],
        [["Shares traded", "11,93,942"]],
        [["Gain on 100 shares", "+₹17,621"]],
      ]);
  });

  it("keeps the reader's view when new data arrives, and gives no value where one is missing", async () => {
    const { x, y, width } = await box(3);
    // Zoom in around the middle, then drag the latest reading out of view, so a new one cannot shift the view.
    await page.mouse.move(x + width / 2, y + 60);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.wheel(0, -600);
    await page.mouse.down();
    await page.mouse.move(x + width / 2 + 250, y + 60, { steps: 5 });
    await page.mouse.up();
    const held = await valueAt(3, 200);
    expect(held).toMatch(/^\d/);
    await card(3).getByRole("button", { name: "Add 5 minutes" }).click();
    await page.waitForTimeout(300);
    expect(await valueAt(3, 200)).toBe(held);
    // Readings 50 to 59 of 95 are missing: somewhere along the plot the crosshair finds no value.
    await page.reload();
    await plot(3).locator("canvas").first().waitFor();
    const found: (string | undefined)[] = [];
    for (let at = 0.4; at < 0.75; at += 0.02) found.push(await valueAt(3, (width - 70) * at));
    expect(found).toContain("—");
  });

  it("greys a stale card's chart and draws a placeholder in the chart's place, at its height", async () => {
    await plot(4).scrollIntoViewIfNeeded();
    expect(await plot(4).evaluate((element) => getComputedStyle(element).filter)).toBe("grayscale(1)");
    await expect.poll(() => plot(4).locator("canvas").count()).toBeGreaterThan(0);
    expect(await plot(5).locator("canvas").count()).toBe(0);
    expect(await plot(5).evaluate((element) => element.clientHeight)).toBe(
      await plot(4).evaluate((element) => element.clientHeight),
    );
  });

  it("writes no axis tick where a value tag covers it, in every pane", async () => {
    await box(0);
    const labels = (await axisLabels()).filter(({ axis }) => axis === "price");
    const latest = await legendValues();
    // The example's levels: zero in the second pane, half long in the third.
    const levels = [[], ["0"], ["50%"]];
    // A 12px tick's text against a tag 17px tall, the library's padding round a 12px font.
    const reach = (12 + 17) / 2;
    for (const [pane, values] of latest.entries()) {
      const tags = [...values.map(([, value]) => value), ...(levels[pane] ?? [])];
      const onPane = labels.filter((label) => label.pane === pane);
      const tagged = onPane.filter(({ text }) => tags.includes(text));
      expect(tagged.length, `pane ${pane}`).toBe(tags.length);
      for (const tick of onPane.filter(({ text }) => !tags.includes(text))) {
        for (const tag of tagged)
          expect(Math.abs(tick.y - tag.y), `${tick.text} under ${tag.text}`).toBeGreaterThanOrEqual(reach);
      }
    }
  });

  it("writes the dates at the data's first and last points whole", async () => {
    // Where the example's end dates were cut: "ec" for Dec on a laptop, "12 No" for 12 Nov on a phone. A range's
    // left edge falls mid-data, where a cut date says there is more to pan to. The library pulls an edge date in to
    // a whole pixel plus a half (Math.floor(x - width / 2) + 0.5), so with a font whose letters are a fraction of a
    // pixel wide the date may sit up to half a pixel past the edge, which no reader sees.
    const SNAP = 0.5;
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const range of ["All", "1M"]) {
        await box(0);
        await card(0).getByRole("button", { name: range }).click();
        const labels = (await axisLabels()).filter(({ axis }) => axis === "time").toSorted((a, b) => a.x - b.x);
        const first = labels.at(0);
        const last = labels.at(-1);
        if (!first || !last) throw new Error(`${width} ${range}: no dates`);
        if (range === "All") expect(first.x - first.width / 2, `${width}: ${first.text}`).toBeGreaterThanOrEqual(-SNAP);
        expect(last.x + last.width / 2, `${width} ${range}: ${last.text}`).toBeLessThanOrEqual(last.canvasWidth + SNAP);
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await card(0).getByRole("button", { name: "All" }).click();
  });

  it("writes each note clear of the line, inside the plot and apart from the others, and lists under the chart those with no room", async () => {
    // The price example's notes, and those in its last year, which ends in August 2026.
    const events = [
      "rate rise",
      "bank failure abroad",
      "election results",
      "budget raises tax on gains",
      "market high",
      "fees cut",
      "budget",
    ];
    const inView = { All: events, "1Y": ["budget"] };
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const range of ["All", "1Y"] as const) {
        await box(1);
        await card(1).getByRole("button", { name: range }).click();
        const { texts, lines, width: plotWidth, legendBottom } = await paneDrawing(1, events);
        const listed = await card(1).locator('[data-slot="time-series-chart-notes"] li').allInnerTexts();
        const where = `${width} ${range}`;
        expect(lines.length, `${where}: the line`).toBeGreaterThan(0);
        for (const text of texts) {
          const name = `${where}: ${text.text}`;
          expect(text.left, name).toBeGreaterThanOrEqual(0);
          expect(text.right, name).toBeLessThanOrEqual(plotWidth);
          expect(text.top, `${name} under the legend`).toBeGreaterThanOrEqual(legendBottom);
          const struck = lines.some((points) =>
            points.some((point, i) => i > 0 && crosses(text, points[i - 1]!, point)),
          );
          expect(struck, `${name} struck by the line`).toBe(false);
          for (const other of texts.filter((candidate) => candidate !== text)) {
            const apart =
              other.right <= text.left ||
              text.right <= other.left ||
              other.bottom <= text.top ||
              text.bottom <= other.top;
            expect(apart, `${name} on ${other.text}`).toBe(true);
          }
        }
        // A note with no room is written out with its date, so every note in view can be read.
        const written = new Set(texts.map(({ text }) => text));
        const unwritten = inView[range].filter((event) => !written.has(event));
        expect(
          listed.map((item) => item.replace(/^.*\d{4}\s+/s, "")),
          where,
        ).toEqual(unwritten);
        if (width === 390 && range === "All")
          expect(unwritten.length, "seven notes in a phone's five years").toBeGreaterThan(0);
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await card(1).getByRole("button", { name: "1Y" }).click();
  });

  it("writes a pane's axis ticks with its tick format and its legend with its format", async () => {
    await box(1);
    const ticks = (await axisLabels(1)).filter(({ axis }) => axis === "price").map(({ text }) => text);
    const [[[, latest = ""] = []] = []] = await legendValues(1);
    expect(latest).toMatch(/^₹[\d,]+\.\d\d$/);
    // The latest value's tag keeps its paise; every tick is a whole number of rupees.
    const rest = ticks.filter((text) => text !== latest);
    expect(rest.length).toBeGreaterThan(2);
    for (const tick of rest) expect(tick).toMatch(/^₹[\d,]+$/);
  });

  it("gives a leading chart's first pane its least height on a phone, and its width's height on a wider screen", async () => {
    const paneHeight = () =>
      plot(1)
        .locator("table tr")
        .first()
        .evaluate((row) => row.clientHeight);
    await box(1);
    const wide = await plot(1).evaluate((root) => root.clientWidth);
    expect(await paneHeight()).toBe(Math.round(Math.min(420, wide * 0.45)));
    await page.setViewportSize({ width: 390, height: 844 });
    await box(1);
    await expect.poll(paneHeight).toBe(360);
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  it("credits TradingView under a card's chart, not with a logo over its lines", async () => {
    expect(await card(0).getByRole("link", { name: "TradingView Lightweight Charts" }).isVisible()).toBe(true);
    expect(await card(0).locator("#tv-attr-logo").count()).toBe(0);
  });
});
