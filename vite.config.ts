import { defineConfig, loadEnv } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import vue from "@vitejs/plugin-vue";

const runtime = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};
const base =
  runtime.process?.env?.VITE_DEPLOY_TARGET === "github-pages" ? "/vancy-learn-english/" : "/";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const reviewSyncUrl = String(env.VITE_REVIEW_SYNC_URL || "").trim();
  const proxy: Record<
    string,
    {
      target: string;
      changeOrigin: boolean;
      rewrite: (path: string) => string;
    }
  > = {
    "/api/openverse": {
      target: "https://api.openverse.org",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/openverse/, "")
    }
  };

  if (reviewSyncUrl) {
    try {
      const endpoint = new URL(reviewSyncUrl);
      proxy["/api/review-state"] = {
        target: endpoint.origin,
        changeOrigin: true,
        rewrite: (path) => {
          const queryIndex = path.indexOf("?");
          const query = queryIndex >= 0 ? path.slice(queryIndex) : endpoint.search;
          return `${endpoint.pathname}${query}`;
        }
      };
    } catch {
      // Invalid endpoint values are reported by the app's existing sync error handling.
    }
  }

  return {
    base,
    plugins: [
      vue(),
      basicSsl({
        name: "vancy-learn-english"
      })
    ],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy
    }
  };
});
