import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

vi.mock("vite", { spy: true });

const catalogues: Catalogue[] = [];

afterEach(async () => {
  await Promise.all(catalogues.splice(0).map((catalogue) => catalogue.close()));
  vi.restoreAllMocks();
});

it("keeps one catalogue's dependency files usable after another catalogue closes", async () => {
  const first = await openCatalogue("foundations/surfaces");
  catalogues.push(first);
  const firstServer = await vi.mocked(createServer).mock.results.at(-1)!.value;
  const firstFile = join(firstServer.config.cacheDir, "owner.txt");
  await writeFile(firstFile, "first");

  const second = await openCatalogue("overview");
  catalogues.push(second);
  const secondServer = await vi.mocked(createServer).mock.results.at(-1)!.value;
  await writeFile(join(secondServer.config.cacheDir, "owner.txt"), "second");
  await second.close();
  catalogues.pop();
  await expect(access(secondServer.config.cacheDir)).rejects.toThrow();

  expect(await readFile(firstFile, "utf8")).toBe("first");
  await first.page.reload();
  await first.page.locator("#surfaces").getByRole("button", { name: "Ruled", exact: true }).waitFor();
}, 60_000);

it("closes the server and removes its cache when listening fails", async () => {
  const actual = await vi.importActual<typeof import("vite")>("vite");
  let server: ViteDevServer | undefined;
  const failure = new Error("test listen failure");
  vi.mocked(createServer).mockImplementationOnce(async (options) => {
    server = await actual.createServer(options);
    vi.spyOn(server, "listen").mockRejectedValueOnce(failure);
    vi.spyOn(server, "close");
    return server;
  });

  await expect(openCatalogue("overview")).rejects.toThrow(failure);
  expect(server?.close).toHaveBeenCalledOnce();
  await expect(access(server!.config.cacheDir)).rejects.toThrow();
}, 60_000);

it("closes the browser and server and removes the cache when navigation fails", async () => {
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
  const server = await vi.mocked(createServer).mock.results.at(-1)!.value;
  expect(browser?.isConnected()).toBe(false);
  expect(server.httpServer?.listening).toBe(false);
  await expect(access(server.config.cacheDir)).rejects.toThrow();
}, 60_000);
