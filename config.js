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

// Mobile-first daily learning UI.
// Kept separate from the existing app so the stable learning logic remains untouched.
(() => {
  const version = "20260728-1";

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
})();