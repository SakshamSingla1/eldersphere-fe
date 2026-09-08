import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

// Kept separate from vite.config.ts (rather than a `test` block bolted onto it) so the
// production Vite config stays focused on the app build — `vite build`/`vite dev` ignore
// unknown `test` keys anyway, but a dedicated file makes the split obvious and lets
// `vitest` be invoked directly without touching the app config at all.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      restoreMocks: true,
    },
  })
);
