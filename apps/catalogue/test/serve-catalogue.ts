// One Vite server for every catalogue suite, started once before the run. A server per suite ran a dependency
// optimizer per suite, all at once, and a cold page could miss its load timeout on a busy machine.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Test workers start after this and inherit the environment, so the URL reaches every suite. */
export default async function serveCatalogue(): Promise<() => Promise<void>> {
  const cacheDir = await mkdtemp(join(tmpdir(), "siyahi-catalogue-"));
  const server = await createServer({
    cacheDir,
    configFile: at("../vite.config.ts"),
    root: at(".."),
    logLevel: "error",
    // Compile the pages and their lazy examples up front, so no suite's first load waits on a cold transform.
    server: { port: 0, warmup: { clientFiles: ["./src/**/*.tsx"] } },
    // The package from source, as the other tests use it, so no build is needed.
    resolve: {
      alias: [
        { find: /^@siyahi\/ui$/, replacement: at("../../../packages/ui/src/index.ts") },
        { find: /^@siyahi\/ui\/styles\.css$/, replacement: at("./from-source.css") },
        { find: /^@siyahi\/ui\/report\.css/, replacement: at("../../../packages/ui/report.css") },
        { find: /^@siyahi\/ui\/(.*)$/, replacement: at("../../../packages/ui/src/$1") },
      ],
    },
  });
  await server.listen();
  process.env.SIYAHI_CATALOGUE_URL = server.resolvedUrls!.local[0]!;
  return async () => {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  };
}
