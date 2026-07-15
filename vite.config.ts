import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const runtime = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};
const base =
  runtime.process?.env?.VITE_DEPLOY_TARGET === "github-pages" ? "/vancy-learn-english/" : "/";

export default defineConfig({
  base,
  plugins: [vue()]
});
