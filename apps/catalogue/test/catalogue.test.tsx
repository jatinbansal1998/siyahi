import { chromium, type Browser } from "playwright";
import { afterEach, expect, it, onTestFinished, vi } from "vite-plus/test";
import { openCatalogue } from "./catalogue";

afterEach(() => {
  vi.restoreAllMocks();
});

it("opens a page from the shared catalogue server", async () => {
  const catalogue = await openCatalogue("overview");
  onTestFinished(catalogue.close);
  expect(await catalogue.page.getByRole("heading", { level: 1 }).innerText()).toBe("Siyahi");
}, 60_000);

it("fails on close when the page threw or logged a console error", async () => {
  const catalogue = await openCatalogue("overview");
  const thrown = catalogue.page.waitForEvent("pageerror");
  await catalogue.page.evaluate(() => {
    console.error("no rows for the chart");
    setTimeout(() => {
      throw new Error("chart failed to load");
    });
  });
  await thrown;
  const closing = catalogue.close();
  await expect(closing).rejects.toThrow("console error: no rows for the chart");
  await expect(closing).rejects.toThrow("page error: chart failed to load");
}, 60_000);

it("closes the browser when navigation fails, and reports the failure over any browser error before it", async () => {
  const launch = chromium.launch.bind(chromium);
  let browser: Browser | undefined;
  const failure = new Error("test navigation failure");
  vi.spyOn(chromium, "launch").mockImplementationOnce(async (options) => {
    browser = await launch(options);
    const newPage = browser.newPage.bind(browser);
    vi.spyOn(browser, "newPage").mockImplementationOnce(async (pageOptions) => {
      const page = await newPage(pageOptions);
      vi.spyOn(page, "goto").mockImplementationOnce(async () => {
        await page.evaluate(() => console.error("logged before the failure"));
        throw failure;
      });
      return page;
    });
    return browser;
  });

  await expect(openCatalogue("overview")).rejects.toThrow(failure);
  expect(browser?.isConnected()).toBe(false);
}, 60_000);
