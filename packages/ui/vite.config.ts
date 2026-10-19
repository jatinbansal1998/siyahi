import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/**/*.{ts,tsx}"],
    unbundle: true,
    dts: true,
    platform: "browser",
    // The per-file size table runs to hundreds of lines; warnings still print.
    logLevel: "warn",
    inputOptions: {
      // shadcn marks client components with "use client". Consumers are
      // client-rendered Vite apps, so the directive has no reader to keep it for.
      onLog(level, log, defaultHandler) {
        if (log.code !== "MODULE_LEVEL_DIRECTIVE") defaultHandler(level, log);
      },
    },
  },
});
