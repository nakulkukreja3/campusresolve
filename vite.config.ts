// @lovable.dev/vite-tanstack-config already includes TanStack Start,
// React, Tailwind, tsconfig paths, Cloudflare build config, env injection,
// aliases, dedupe, and required Lovable plugins.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});
