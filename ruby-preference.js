(() => {
  const STORAGE_KEY = "liberty-ruby-enabled";
  let answerConversionToken = 0;
  let answerObserver = null;

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
    localStorage.setItem(STORAGE_KEY, isRubyEnabled() ? "true" : "false");
  };

  const updateButton = () => {
    const button = document.getElementById("toggle-ruby");
    if (!button) return;

    const enabled = isRubyEnabled();
    const japaneseMode = getCurrentLanguage() === "ja";

    button.textContent = enabled ? "ルビ表示：ON" : "ルビ表示：OFF";
    button.setAttribute("aria-pressed", String(enabled));
    button.title = japaneseMode
      ? "問題文と模範仕訳のルビ表示を切り替えます"
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

  const restorePlainAnswer = () => {
    const answer = document.getElementById("answer-ja");
    if (!answer) return;

    let plainText = answer.dataset.rubyBaseText || "";
    try {
      if (questions?.length && questions[currentIndex]) {
        plainText = questions[currentIndex].journalJa || plainText;
      }
    } catch {
      // Keep the stored base text when question state is not ready.
    }

    if (plainText) {
      answer.textContent = plainText;
      answer.dataset.rubyBaseText = plainText;
    }
  };

  const applyRubyToAnswer = async () => {
    const answer = document.getElementById("answer-ja");
    if (!answer) return;

    if (!isRubyEnabled() || getCurrentLanguage() !== "ja") {
      restorePlainAnswer();
      return;
    }

    let plainText = "";
    try {
      if (questions?.length && questions[currentIndex]) {
        plainText = questions[currentIndex].journalJa || "";
      }
    } catch {
      plainText = "";
    }

    if (!plainText) {
      plainText = answer.dataset.rubyBaseText || answer.textContent || "";
    }
    if (!plainText.trim()) return;

    answer.dataset.rubyBaseText = plainText;
    const token = ++answerConversionToken;

    try {
      if (typeof initKuroshiro === "function") {
        await initKuroshiro();
      }
      if (token !== answerConversionToken || !isRubyEnabled()) return;
      if (!kuroshiroReady || !kuroshiro) return;

      const converted = await kuroshiro.convert(plainText, {
        to: "hiragana",
        mode: "furigana"
      });

      if (token !== answerConversionToken || !isRubyEnabled()) return;
      answer.innerHTML = toRubyHtml(converted);
    } catch (error) {
      console.error("Model answer ruby conversion failed:", error);
      answer.textContent = plainText;
    }
  };

  const restorePreference = async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== "true") {
      updateButton();
      return;
    }

    try {
      rubyEnabled = true;
      updateButton();
      if (typeof initKuroshiro === "function") {
        await initKuroshiro();
      }
      if (typeof renderQuestion === "function") {
        renderQuestion();
      }
      await applyRubyToAnswer();
    } catch (error) {
      console.error("Ruby preference restore failed:", error);
      rubyEnabled = false;
      localStorage.setItem(STORAGE_KEY, "false");
      updateButton();
    }
  };

  const watchAnswer = () => {
    const answer = document.getElementById("answer-ja");
    if (!answer || answerObserver) return;

    answerObserver = new MutationObserver(() => {
      if (answer.querySelector("ruby") && isRubyEnabled()) return;
      window.setTimeout(applyRubyToAnswer, 0);
    });
    answerObserver.observe(answer, {
      childList: true,
      characterData: true,
      subtree: true
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("toggle-ruby");
    const langJa = document.getElementById("lang-ja");
    const langEn = document.getElementById("lang-en");

    watchAnswer();
    restorePreference();

    button?.addEventListener("click", () => {
      window.setTimeout(() => {
        savePreference();
        updateButton();
        applyRubyToAnswer();
      }, 0);
    });

    langJa?.addEventListener("click", () => {
      window.setTimeout(() => {
        updateButton();
        applyRubyToAnswer();
      }, 0);
    });

    langEn?.addEventListener("click", () => {
      window.setTimeout(() => {
        updateButton();
        restorePlainAnswer();
      }, 0);
    });
  });
})();
