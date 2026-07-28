// config.js
// Liberty Bookkeeping Trainer - Environment Config (GitHub Pages)

// ✅ アプリのベースURL（GitHub Pages のURL）
window.APP_BASE_URL = "https://libertyyoshida-sudo.github.io/liberty-bookkeeping-trainer";

// ✅ Supabase Project URL
window.SUPABASE_URL = "https://uczxiifxjzwbarkstvnt.supabase.co";

// ✅ Supabase anon public key（公開OKのキー）
window.SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjenhpaWZ4anp3YmFya3N0dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTcwODQsImV4cCI6MjA3OTQzMzA4NH0.UCMjF7gaU7HstTPG16QuKi9Idxyl-Zh9AG7XjmvJ1UU";

// AI関係
window.APP_AI_WORKER_URL = "https://ai-chat.libertyyoshida.workers.dev";

// Mobile-first daily learning UI and PWA bootstrap.
// Kept separate from the existing app so the stable learning logic remains untouched.
(() => {
  const version = "20260728-2";

  if (!document.querySelector('meta[name="theme-color"]')) {
    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#1769e0";
    document.head.appendChild(themeColor);
  }

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = `manifest.webmanifest?v=${version}`;
    document.head.appendChild(manifest);
  }

  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const appleTouchIcon = document.createElement("link");
    appleTouchIcon.rel = "apple-touch-icon";
    appleTouchIcon.href = `app-icon.svg?v=${version}`;
    document.head.appendChild(appleTouchIcon);
  }

  if (!document.querySelector('link[data-daily-ui="true"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `daily-ui.css?v=${version}`;
    link.dataset.dailyUi = "true";
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[data-daily-ui="true"]')) {
    const script = document.createElement("script");
    script.src = `daily-ui.js?v=${version}`;
    script.defer = true;
    script.dataset.dailyUi = "true";
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-pwa-install="true"]')) {
    const script = document.createElement("script");
    script.src = `pwa-install.js?v=${version}`;
    script.defer = true;
    script.dataset.pwaInstall = "true";
    document.head.appendChild(script);
  }

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `service-worker.js?v=${version}`,
          { scope: "./" }
        );

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent("liberty-pwa-update-ready", {
                detail: { registration }
              }));
            }
          });
        });
      } catch (error) {
        console.warn("Service Worker registration failed:", error);
      }
    });
  }
})();