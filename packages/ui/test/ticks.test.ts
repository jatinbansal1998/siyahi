import { describe, expect, it } from "vite-plus/test";
import { linearTicks, logTicks, ticksFor } from "../src/lib/ticks";

describe("logTicks", () => {
  it("runs 1, 2, 5 from the largest at or under the smallest value to the smallest at or over the largest", () => {
    expect(logTicks(0.004, 0.112)).toEqual([0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2]);
  });

  it("starts on a value that is itself a tick", () => {
    expect(logTicks(0.01, 0.05)).toEqual([0.01, 0.02, 0.05]);
  });
});

describe("ticksFor", () => {
  it("gives a linear axis round steps from below its smallest value, not ticks starting at the data", () => {
    // A book's share of value from a 0.4% position to a 14.7% one.
    expect(ticksFor("linear", 0.004, 0.147)).toEqual([0, 0.05, 0.1, 0.15]);
  });

  it("gives a log axis 1, 2 and 5 steps", () => {
    expect(ticksFor("log", 0.004, 0.147)).toEqual([0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2]);
  });
});

describe("linearTicks", () => {
  it("covers the data in a 1, 2, 2.5 or 5 step instead of overshooting it", () => {
    expect(linearTicks(-0.33, 0.58)).toEqual([-0.5, -0.25, 0, 0.25, 0.5, 0.75]);
  });

  it("starts and ends on the data's own values when they fall on a step", () => {
    expect(linearTicks(0.3, 0.4)).toEqual([0.3, 0.325, 0.35, 0.375, 0.4]);
  });

  it("stops at the data's end instead of adding a near-zero tick past it", () => {
    expect(linearTicks(-0.5, -0.1)).toEqual([-0.5, -0.4, -0.3, -0.2, -0.1]);
  });

  it("gives values that differ only by float noise one tick, and returns", () => {
    expect(linearTicks(0.3, 0.30000000000000004)).toEqual([0.3]);
  });
});
