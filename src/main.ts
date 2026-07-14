import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import "./styles/main.css";

function disablePageZoom() {
  const preventDefault = (event: Event) => {
    event.preventDefault();
  };

  document.addEventListener("gesturestart", preventDefault, { passive: false });
  document.addEventListener("gesturechange", preventDefault, { passive: false });
  document.addEventListener("gestureend", preventDefault, { passive: false });

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    const isZoomShortcut = ["+", "-", "=", "0"].includes(event.key);
    if ((event.ctrlKey || event.metaKey) && isZoomShortcut) {
      event.preventDefault();
    }
  });
}

disablePageZoom();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    const baseUrl = import.meta.env.BASE_URL;
    navigator.serviceWorker.register(`${baseUrl}sw.js`, { scope: baseUrl }).catch(() => {});
  });
}

registerServiceWorker();

createApp(App).use(ElementPlus).mount("#app");
