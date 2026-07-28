(() => {
  let deferredPrompt = null;
  let installButton = null;
  let updateBanner = null;
  let refreshing = false;

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const ensureStyles = () => {
    if (document.getElementById("pwa-install-style")) return;

    const style = document.createElement("style");
    style.id = "pwa-install-style";
    style.textContent = `
      .pwa-install-button {
        position: fixed;
        right: 16px;
        bottom: calc(16px + env(safe-area-inset-bottom));
        z-index: 10000;
        display: none;
        align-items: center;
        gap: 8px;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: #1769e0;
        color: #fff;
        box-shadow: 0 12px 32px rgba(23, 105, 224, .28);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .pwa-install-button.is-visible { display: inline-flex; }
      .pwa-install-button:focus-visible,
      .pwa-update-action:focus-visible,
      .pwa-update-dismiss:focus-visible {
        outline: 3px solid rgba(23, 105, 224, .3);
        outline-offset: 3px;
      }
      .pwa-status-toast {
        position: fixed;
        left: 50%;
        bottom: calc(82px + env(safe-area-inset-bottom));
        z-index: 10001;
        max-width: calc(100vw - 32px);
        transform: translateX(-50%);
        border-radius: 12px;
        padding: 10px 14px;
        background: rgba(23, 32, 51, .94);
        color: #fff;
        font-size: .88rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, .2);
      }
      .pwa-update-banner {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: calc(16px + env(safe-area-inset-bottom));
        z-index: 10002;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 680px;
        margin: 0 auto;
        padding: 14px;
        border: 1px solid rgba(23, 105, 224, .2);
        border-radius: 16px;
        background: #fff;
        color: #172033;
        box-shadow: 0 16px 42px rgba(23, 32, 51, .2);
      }
      .pwa-update-copy { flex: 1; min-width: 0; }
      .pwa-update-title { display: block; margin-bottom: 2px; font-weight: 800; }
      .pwa-update-text { margin: 0; font-size: .85rem; line-height: 1.45; color: #566074; }
      .pwa-update-actions { display: flex; align-items: center; gap: 8px; }
      .pwa-update-action,
      .pwa-update-dismiss {
        border: 0;
        border-radius: 10px;
        padding: 9px 12px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .pwa-update-action { background: #1769e0; color: #fff; }
      .pwa-update-dismiss { background: #eef3f9; color: #354052; }
      @media (max-width: 600px) {
        .pwa-install-button { right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); }
        .pwa-update-banner { left: 10px; right: 10px; bottom: calc(10px + env(safe-area-inset-bottom)); align-items: flex-start; }
        .pwa-update-actions { flex-direction: column; }
      }
    `;
    document.head.appendChild(style);
  };

  const showToast = (message) => {
    const current = document.querySelector(".pwa-status-toast");
    if (current) current.remove();

    const toast = document.createElement("div");
    toast.className = "pwa-status-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  };

  const showUpdateBanner = (registration) => {
    if (updateBanner || !registration) return;

    updateBanner = document.createElement("section");
    updateBanner.className = "pwa-update-banner";
    updateBanner.setAttribute("role", "status");
    updateBanner.innerHTML = `
      <div class="pwa-update-copy">
        <strong class="pwa-update-title">新しいバージョンがあります</strong>
        <p class="pwa-update-text">更新すると最新の機能と修正が反映されます。</p>
      </div>
      <div class="pwa-update-actions">
        <button type="button" class="pwa-update-action">更新する</button>
        <button type="button" class="pwa-update-dismiss" aria-label="更新通知を閉じる">後で</button>
      </div>
    `;

    updateBanner.querySelector(".pwa-update-action")?.addEventListener("click", () => {
      const worker = registration.waiting || registration.installing;
      if (!worker) {
        showToast("更新の準備中です。少ししてから再度お試しください。");
        return;
      }

      worker.postMessage({ type: "SKIP_WAITING" });
    });

    updateBanner.querySelector(".pwa-update-dismiss")?.addEventListener("click", () => {
      updateBanner?.remove();
      updateBanner = null;
    });

    document.body.appendChild(updateBanner);
  };

  const ensureInstallButton = () => {
    if (installButton || isStandalone()) return;

    installButton = document.createElement("button");
    installButton.type = "button";
    installButton.className = "pwa-install-button";
    installButton.setAttribute("aria-label", "アプリを端末にインストール");
    installButton.innerHTML = "<span aria-hidden=\"true\">⬇</span><span>アプリを追加</span>";

    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) {
        const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        showToast(
          isiOS
            ? "Safariの共有メニューから『ホーム画面に追加』を選択してください。"
            : "ブラウザのメニューから『アプリをインストール』を選択してください。"
        );
        return;
      }

      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      installButton.classList.remove("is-visible");

      if (choice.outcome === "accepted") {
        showToast("アプリのインストールを開始しました。");
      }
    });

    document.body.appendChild(installButton);
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    ensureInstallButton();
    installButton?.classList.add("is-visible");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installButton?.remove();
    installButton = null;
    showToast("Liberty Bookkeeping Trainerをインストールしました。");
  });

  window.addEventListener("liberty-pwa-update-ready", (event) => {
    showUpdateBanner(event.detail?.registration);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    ensureStyles();
    ensureInstallButton();

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isiOS && !isStandalone()) {
      installButton?.classList.add("is-visible");
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) showUpdateBanner(registration);
    }
  });
})();