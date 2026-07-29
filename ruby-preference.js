(() => {
  const STORAGE_KEY = "liberty-ruby-enabled";
  const ASSET_VERSION = "20260729-9";
  const MAX_CACHE_SIZE = 150;
  const rubyCache = new Map();
  const conversionTokens = new WeakMap();
  const observers = [];
  const renderingTargets = new WeakSet();

  const isRubyEnabled = () => {
    try {
      return typeof rubyEnabled !== "undefined" && rubyEnabled === true;
    } catch {
      return false;
    }
  };

  const getCurrentLanguage = () => {
    try {
      return typeof currentLang === "string" ? currentLang : "ja";
    } catch {
      return "ja";
    }
  };

  const savePreference = () => {
    try {
      localStorage.setItem(STORAGE_KEY, isRubyEnabled() ? "true" : "false");
    } catch (error) {
      console.debug("Ruby preference could not be saved:", error);
    }
  };

  const updateButton = () => {
    const button = document.getElementById("toggle-ruby");
    if (!button) return;

    const enabled = isRubyEnabled();
    const japaneseMode = getCurrentLanguage() === "ja";

    button.textContent = enabled ? "ルビ表示：ON" : "ルビ表示：OFF";
    button.setAttribute("aria-pressed", String(enabled));
    button.title = japaneseMode
      ? "問題文・模範仕訳・AI解説のルビ表示を切り替えます"
      : "ルビ表示は日本語モードで反映されます";
    button.style.background = enabled ? "var(--primary)" : "";
    button.style.color = enabled ? "#fff" : "";
    button.style.opacity = japaneseMode ? "1" : "0.65";
  };

  const installResponsiveRubyPlacement = () => {
    const button = document.getElementById("toggle-ruby");
    const header = document.querySelector(".layout .card-header");
    const question = document.getElementById("question-text-ja");
    if (!button || !header || !question) return;

    let mobileToolbar = document.getElementById("mobile-ruby-toolbar");
    if (!mobileToolbar) {
      mobileToolbar = document.createElement("div");
      mobileToolbar.id = "mobile-ruby-toolbar";
      mobileToolbar.setAttribute("aria-label", "読みやすさ設定");
      question.parentNode.insertBefore(mobileToolbar, question);
    }

    let desktopToolbar = header.querySelector(".desktop-ruby-toolbar");
    if (!desktopToolbar) {
      desktopToolbar = document.createElement("div");
      desktopToolbar.className = "desktop-ruby-toolbar";
      desktopToolbar.setAttribute("aria-label", "ルビ設定");
      const readingTools = header.querySelector(".desktop-reading-tools");
      if (readingTools) header.insertBefore(desktopToolbar, readingTools);
      else header.appendChild(desktopToolbar);
    }

    const relocate = () => {
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      const destination = mobile ? mobileToolbar : desktopToolbar;
      if (button.parentElement !== destination) destination.appendChild(button);
      button.classList.toggle("mobile-ruby-toggle", mobile);
      button.classList.toggle("desktop-ruby-toggle", !mobile);
      button.style.marginLeft = "0";
      button.style.display = "inline-flex";
      button.style.visibility = "visible";
      updateButton();
    };

    if (!document.getElementById("responsive-ruby-toolbar-style")) {
      const style = document.createElement("style");
      style.id = "responsive-ruby-toolbar-style";
      style.textContent = `
        #mobile-ruby-toolbar { display:none; }
        .desktop-ruby-toolbar {
          display:flex;
          align-items:center;
          justify-content:flex-end;
          margin-left:auto;
        }
        .desktop-ruby-toolbar #toggle-ruby,
        #mobile-ruby-toolbar #toggle-ruby {
          align-items:center;
          justify-content:center;
          min-height:38px;
          padding:8px 13px;
          border:1px solid #ead58b;
          border-radius:999px;
          background:#fff4c7;
          color:#604800;
          font-size:.8rem;
          font-weight:800;
          line-height:1;
          white-space:nowrap;
          box-shadow:0 4px 12px rgba(96,72,0,.10);
          cursor:pointer;
        }
        @media (max-width:760px) {
          .desktop-ruby-toolbar { display:none !important; }
          #mobile-ruby-toolbar {
            display:flex !important;
            justify-content:flex-end;
            align-items:center;
            margin:8px 0 10px;
            min-height:42px;
          }
          #mobile-ruby-toolbar #toggle-ruby {
            display:inline-flex !important;
            visibility:visible !important;
            min-height:40px;
            padding:9px 14px;
            border-radius:12px;
          }
        }
        @media (min-width:761px) {
          .desktop-ruby-toolbar { display:flex !important; }
          .desktop-ruby-toolbar #toggle-ruby {
            display:inline-flex !important;
            visibility:visible !important;
          }
        }
        body.daily-dark .desktop-ruby-toolbar #toggle-ruby,
        body.daily-dark #mobile-ruby-toolbar #toggle-ruby {
          background:#3d3517;
          color:#fff4c7;
          border-color:#6b5b20;
        }
      `;
      document.head.appendChild(style);
    }

    relocate();
    window.addEventListener("resize", relocate, { passive: true });
  };

  const loadDesktopLayoutFeature = () => {
    if (document.querySelector('script[data-liberty-desktop-layout]')) return;
    const script = document.createElement("script");
    script.src = `desktop-layout.js?v=${ASSET_VERSION}`;
    script.defer = true;
    script.dataset.libertyDesktopLayout = "true";
    script.onerror = () => console.error("Desktop layout feature could not be loaded.");
    document.head.appendChild(script);
  };

  const toRubyHtml = (converted) => {
    try {
      if (typeof furiganaTextToRubyHtml === "function") return furiganaTextToRubyHtml(converted);
    } catch (error) {
      console.debug("Ruby HTML helper unavailable:", error);
    }
    return converted;
  };

  const rememberCache = (text, html) => {
    if (rubyCache.has(text)) rubyCache.delete(text);
    rubyCache.set(text, html);
    if (rubyCache.size > MAX_CACHE_SIZE) rubyCache.delete(rubyCache.keys().next().value);
  };

  const convertToRubyHtml = async (plainText) => {
    const normalized = String(plainText || "");
    if (!normalized.trim()) return "";
    const cached = rubyCache.get(normalized);
    if (cached) {
      rubyCache.delete(normalized);
      rubyCache.set(normalized, cached);
      return cached;
    }
    if (typeof initKuroshiro === "function") await initKuroshiro();
    if (!kuroshiroReady || !kuroshiro) return "";
    const converted = await kuroshiro.convert(normalized, { to: "hiragana", mode: "furigana" });
    const html = toRubyHtml(converted);
    rememberCache(normalized, html);
    return html;
  };

  const getAnswerPlainText = (answer) => {
    let plainText = "";
    try {
      if (questions?.length && questions[currentIndex]) plainText = questions[currentIndex].journalJa || "";
    } catch {
      plainText = "";
    }
    return plainText || answer.dataset.rubyBaseText || answer.textContent || "";
  };

  const restorePlainTarget = (element, resolver) => {
    if (!element) return;
    conversionTokens.set(element, (conversionTokens.get(element) || 0) + 1);
    const plainText = resolver ? resolver(element) : element.dataset.rubyBaseText || "";
    if (!plainText) return;
    renderingTargets.add(element);
    element.textContent = plainText;
    element.dataset.rubyBaseText = plainText;
    queueMicrotask(() => renderingTargets.delete(element));
  };

  const applyRubyToTarget = async (element, resolver) => {
    if (!element) return;
    if (!isRubyEnabled() || getCurrentLanguage() !== "ja") {
      restorePlainTarget(element, resolver);
      return;
    }
    const plainText = resolver ? resolver(element) : element.dataset.rubyBaseText || element.textContent || "";
    if (!plainText.trim()) return;
    element.dataset.rubyBaseText = plainText;
    const token = (conversionTokens.get(element) || 0) + 1;
    conversionTokens.set(element, token);
    try {
      const html = await convertToRubyHtml(plainText);
      if (!html || conversionTokens.get(element) !== token || !isRubyEnabled()) return;
      renderingTargets.add(element);
      element.innerHTML = html;
      queueMicrotask(() => renderingTargets.delete(element));
    } catch (error) {
      console.error("Ruby conversion failed:", error);
      restorePlainTarget(element, () => plainText);
    }
  };

  const applyRubyToAnswer = () => applyRubyToTarget(document.getElementById("answer-ja"), getAnswerPlainText);
  const applyRubyToAiExplanation = () => applyRubyToTarget(document.getElementById("ai-chat-box"));
  const refreshExtendedRuby = async () => Promise.all([applyRubyToAnswer(), applyRubyToAiExplanation()]);

  const restorePreference = async () => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.debug("Ruby preference could not be read:", error);
    }
    if (stored !== "true") {
      updateButton();
      return;
    }
    try {
      rubyEnabled = true;
      updateButton();
      if (typeof initKuroshiro === "function") await initKuroshiro();
      if (typeof renderQuestion === "function") renderQuestion();
      await refreshExtendedRuby();
    } catch (error) {
      console.error("Ruby preference restore failed:", error);
      rubyEnabled = false;
      try { localStorage.setItem(STORAGE_KEY, "false"); } catch {}
      updateButton();
    }
  };

  const observeTarget = (element, callback) => {
    if (!element) return;
    const observer = new MutationObserver(() => {
      if (renderingTargets.has(element)) return;
      if (element.querySelector("ruby") && isRubyEnabled()) return;
      const currentText = element.textContent || "";
      if (currentText.trim()) element.dataset.rubyBaseText = currentText;
      window.setTimeout(callback, 0);
    });
    observer.observe(element, { childList: true, characterData: true, subtree: true });
    observers.push(observer);
  };

  const loadEasyJapaneseFeature = () => {
    if (document.querySelector('script[data-liberty-easy-japanese]')) return;
    const script = document.createElement("script");
    script.src = `easy-japanese.js?v=${ASSET_VERSION}`;
    script.defer = true;
    script.dataset.libertyEasyJapanese = "true";
    script.onerror = () => console.error("Easy Japanese feature could not be loaded.");
    document.head.appendChild(script);
  };

  document.addEventListener("DOMContentLoaded", () => {
    loadDesktopLayoutFeature();
    installResponsiveRubyPlacement();

    const button = document.getElementById("toggle-ruby");
    const langJa = document.getElementById("lang-ja");
    const langEn = document.getElementById("lang-en");
    const answer = document.getElementById("answer-ja");
    const aiBox = document.getElementById("ai-chat-box");

    observeTarget(answer, applyRubyToAnswer);
    observeTarget(aiBox, applyRubyToAiExplanation);
    restorePreference();
    loadEasyJapaneseFeature();

    button?.addEventListener("click", () => {
      window.setTimeout(() => {
        savePreference();
        updateButton();
        refreshExtendedRuby();
      }, 0);
    });

    langJa?.addEventListener("click", () => {
      window.setTimeout(() => {
        updateButton();
        refreshExtendedRuby();
      }, 0);
    });

    langEn?.addEventListener("click", () => {
      window.setTimeout(() => {
        updateButton();
        restorePlainTarget(answer, getAnswerPlainText);
        restorePlainTarget(aiBox);
      }, 0);
    });
  });
})();
