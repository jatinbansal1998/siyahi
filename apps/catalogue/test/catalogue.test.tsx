import { chromium, type Browser } from "playwright";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { openCatalogue } from "./catalogue";

afterEach(() => {
  vi.restoreAllMocks();
});

it("opens a page from the shared catalogue server", async () => {
  const catalogue = await openCatalogue("overview");
  try {
    expect(await catalogue.page.getByRole("heading", { level: 1 }).innerText()).toBe("Siyahi");
  } finally {
    await catalogue.close();
  }
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

it("closes the browser when navigation fails", async () => {
  const launch = chromium.launch.bind(chromium);
  let browser: Browser | undefined;
  const failure = new Error("test navigation failure");
  vi.spyOn(chromium, "launch").mockImplementationOnce(async (options) => {
    browser = await launch(options);
    const newPage = browser.newPage.bind(browser);
    vi.spyOn(browser, "newPage").mockImplementationOnce(async (pageOptions) => {
      const page = await newPage(pageOptions);
      vi.spyOn(page, "goto").mockRejectedValueOnce(failure);
      return page;
    });
    return browser;
  });

  await expect(openCatalogue("overview")).rejects.toThrow(failure);
  expect(browser?.isConnected()).toBe(false);
}, 60_000);
