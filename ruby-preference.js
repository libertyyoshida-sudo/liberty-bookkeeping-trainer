(() => {
  const STORAGE_KEY = "liberty-ruby-enabled";
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

  const toRubyHtml = (converted) => {
    try {
      if (typeof furiganaTextToRubyHtml === "function") {
        return furiganaTextToRubyHtml(converted);
      }
    } catch (error) {
      console.debug("Ruby HTML helper unavailable:", error);
    }
    return converted;
  };

  const rememberCache = (text, html) => {
    if (rubyCache.has(text)) rubyCache.delete(text);
    rubyCache.set(text, html);

    if (rubyCache.size > MAX_CACHE_SIZE) {
      const oldestKey = rubyCache.keys().next().value;
      rubyCache.delete(oldestKey);
    }
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

    if (typeof initKuroshiro === "function") {
      await initKuroshiro();
    }
    if (!kuroshiroReady || !kuroshiro) return "";

    const converted = await kuroshiro.convert(normalized, {
      to: "hiragana",
      mode: "furigana"
    });
    const html = toRubyHtml(converted);
    rememberCache(normalized, html);
    return html;
  };

  const getAnswerPlainText = (answer) => {
    let plainText = "";
    try {
      if (questions?.length && questions[currentIndex]) {
        plainText = questions[currentIndex].journalJa || "";
      }
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

    const plainText = resolver
      ? resolver(element)
      : element.dataset.rubyBaseText || element.textContent || "";
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

  const applyRubyToAnswer = () => {
    const answer = document.getElementById("answer-ja");
    return applyRubyToTarget(answer, getAnswerPlainText);
  };

  const applyRubyToAiExplanation = () => {
    const aiBox = document.getElementById("ai-chat-box");
    return applyRubyToTarget(aiBox);
  };

  const refreshExtendedRuby = async () => {
    await Promise.all([
      applyRubyToAnswer(),
      applyRubyToAiExplanation()
    ]);
  };

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
      try {
        localStorage.setItem(STORAGE_KEY, "false");
      } catch {
        // Ignore storage failures and keep the page usable.
      }
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

    observer.observe(element, {
      childList: true,
      characterData: true,
      subtree: true
    });
    observers.push(observer);
  };

  const loadEasyJapaneseFeature = () => {
    if (document.querySelector('script[data-liberty-easy-japanese]')) return;

    const script = document.createElement("script");
    script.src = "easy-japanese.js?v=20260728-8";
    script.defer = true;
    script.dataset.libertyEasyJapanese = "true";
    script.onerror = () => console.error("Easy Japanese feature could not be loaded.");
    document.head.appendChild(script);
  };

  document.addEventListener("DOMContentLoaded", () => {
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
