import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { LocalTime } from "../src/components/siyahi/local-time";

describe("LocalTime", () => {
  it("prints the date before the time with withDate", () => {
    expect(renderToStaticMarkup(<LocalTime value="2026-06-26T04:11:00Z" withDate />)).toContain(
      ">26 Jun 2026, 09:41 IST</time>",
    );
  });
});
