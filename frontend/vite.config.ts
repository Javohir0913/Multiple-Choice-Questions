import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      // Docker Desktop on Windows doesn't reliably forward inotify events
      // from the bind-mounted host directory, so native fs-event watching
      // silently misses file changes. Polling guarantees changes are seen.
      usePolling: true,
      interval: 300,
    },
  },
});
