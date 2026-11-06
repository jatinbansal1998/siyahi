import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { Delta } from "../src/components/siyahi/delta";

/** The rendered text and the classes on the trend icon. */
function read(value: number, format?: "pct" | "money") {
  const html = renderToStaticMarkup(<Delta value={value} format={format} />);
  const text = html.replace(/<[^>]+>/g, "");
  const icon = /<svg[^>]*class="([^"]+)"/.exec(html)?.[1] ?? "";
  return { text, icon };
}

describe("Delta", () => {
  it("writes the sign in the text and colours only the trend icon", () => {
    const up = read(0.023);
    expect(up.text).toBe("+2.3%");
    expect(up.icon).toContain("lucide-trending-up");
    expect(up.icon).toContain("text-positive");

    const down = read(-4300, "money");
    expect(down.text).toBe("−₹4,300");
    expect(down.icon).toContain("lucide-trending-down");
    expect(down.icon).toContain("text-negative");

    const none = read(0);
    expect(none.text).toBe("0.0%");
    expect(none.icon).toContain("text-muted-foreground");
  });
});
