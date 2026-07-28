(() => {
  let deferredPrompt = null;
  let installButton = null;

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
      .pwa-install-button:focus-visible { outline: 3px solid rgba(23, 105, 224, .3); outline-offset: 3px; }
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
      @media (max-width: 600px) {
        .pwa-install-button { right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); }
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

  document.addEventListener("DOMContentLoaded", () => {
    ensureStyles();
    ensureInstallButton();

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isiOS && !isStandalone()) {
      installButton?.classList.add("is-visible");
    }
  });
})();