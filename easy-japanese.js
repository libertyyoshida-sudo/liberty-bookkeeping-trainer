(() => {
  const STORAGE_KEY = "liberty-easy-japanese-enabled";
  const questionElement = () => document.getElementById("question-text-ja");
  let enabled = false;
  let rendering = false;
  let renderToken = 0;
  let observer = null;

  const getCurrentQuestion = () => {
    try {
      return questions?.length ? questions[currentIndex] : null;
    } catch {
      return null;
    }
  };

  const getCurrentLanguage = () => {
    try {
      return typeof currentLang === "string" ? currentLang : "ja";
    } catch {
      return "ja";
    }
  };

  const isRubyEnabled = () => {
    try {
      return typeof rubyEnabled !== "undefined" && rubyEnabled === true;
    } catch {
      return false;
    }
  };

  const normalizeSentence = (text) => String(text || "")
    .replace(/。\s*/g, "。\n")
    .replace(/、(?=.{18,})/g, "、\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const simplifyJapanese = (source) => {
    let text = String(source || "");

    const replacements = [
      [/取引先/g, "仕事の相手"],
      [/得意先/g, "商品を売った相手"],
      [/仕入先/g, "商品を買った相手"],
      [/購入した/g, "買いました"],
      [/購入し/g, "買い"],
      [/売却した/g, "売りました"],
      [/売却し/g, "売り"],
      [/支払った/g, "払いました"],
      [/支払いを行った/g, "払いました"],
      [/受け取った/g, "受け取りました"],
      [/受領した/g, "受け取りました"],
      [/振り込んだ/g, "銀行から払いました"],
      [/振り込まれた/g, "銀行に入金されました"],
      [/計上した/g, "帳簿に記録しました"],
      [/計上する/g, "帳簿に記録します"],
      [/発生した/g, "発生しました"],
      [/借り入れた/g, "お金を借りました"],
      [/貸し付けた/g, "お金を貸しました"],
      [/返済した/g, "借りたお金を返しました"],
      [/回収した/g, "代金を受け取りました"],
      [/精算した/g, "金額を確認して処理しました"],
      [/取得した/g, "手に入れました"],
      [/処分した/g, "手放しました"],
      [/当該/g, "この"],
      [/なお、/g, "また、"],
      [/ただし、/g, "しかし、"],
      [/および/g, "と"],
      [/ならびに/g, "と"],
      [/したものとする/g, "しました"],
      [/するものとする/g, "します"],
      [/であった/g, "でした"],
      [/である/g, "です"],
      [/行った/g, "しました"],
      [/行う/g, "します"]
    ];

    replacements.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });

    return normalizeSentence(text);
  };

  const getEasyText = (question) => {
    if (!question) return "";
    return question.questionEasyJa
      || question.easyJa
      || question.questionSimpleJa
      || simplifyJapanese(question.questionJa || "");
  };

  const toRubyHtml = async (text) => {
    try {
      if (typeof initKuroshiro === "function") await initKuroshiro();
      if (!kuroshiroReady || !kuroshiro) return "";

      const converted = await kuroshiro.convert(text, {
        to: "hiragana",
        mode: "furigana"
      });

      return typeof furiganaTextToRubyHtml === "function"
        ? furiganaTextToRubyHtml(converted)
        : converted;
    } catch (error) {
      console.error("Easy Japanese ruby conversion failed:", error);
      return "";
    }
  };

  const updateButton = () => {
    const button = document.getElementById("toggle-easy-ja");
    if (!button) return;

    const japaneseMode = getCurrentLanguage() === "ja";
    button.textContent = enabled ? "やさしい日本語：ON" : "やさしい日本語：OFF";
    button.setAttribute("aria-pressed", String(enabled));
    button.title = japaneseMode
      ? "問題文を短く、分かりやすい日本語にします"
      : "やさしい日本語は日本語モードで使えます";
    button.style.background = enabled ? "var(--primary)" : "";
    button.style.color = enabled ? "#fff" : "";
    button.style.opacity = japaneseMode ? "1" : "0.65";
  };

  const render = async () => {
    const element = questionElement();
    const question = getCurrentQuestion();
    const token = ++renderToken;

    updateButton();
    if (!element || !question || !enabled || getCurrentLanguage() !== "ja") return;

    const text = getEasyText(question);
    if (!text) return;

    rendering = true;
    element.textContent = text;
    element.dataset.easyJapanese = "true";
    element.dataset.easyJapaneseText = text;
    queueMicrotask(() => { rendering = false; });

    if (!isRubyEnabled()) return;
    const html = await toRubyHtml(text);
    if (!html || token !== renderToken || !enabled || getCurrentLanguage() !== "ja") return;

    rendering = true;
    element.innerHTML = html.replace(/\n/g, "<br>");
    queueMicrotask(() => { rendering = false; });
  };

  const restoreOriginal = () => {
    const element = questionElement();
    const question = getCurrentQuestion();
    if (!element || !question || getCurrentLanguage() !== "ja") return;

    renderToken += 1;
    rendering = true;
    element.dataset.easyJapanese = "false";
    element.textContent = question.questionJa || "";
    queueMicrotask(() => { rendering = false; });

    try {
      if (typeof renderQuestion === "function") renderQuestion();
    } catch (error) {
      console.debug("Original question could not be re-rendered:", error);
    }
  };

  const setEnabled = (nextValue) => {
    enabled = Boolean(nextValue);
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    } catch (error) {
      console.debug("Easy Japanese preference could not be saved:", error);
    }

    updateButton();
    if (enabled) render();
    else restoreOriginal();
  };

  const addButton = () => {
    if (document.getElementById("toggle-easy-ja")) return;
    const rubyButton = document.getElementById("toggle-ruby");
    if (!rubyButton?.parentElement) return;

    const button = document.createElement("button");
    button.id = "toggle-easy-ja";
    button.className = "auth-small-btn";
    button.style.marginLeft = "8px";
    button.type = "button";
    rubyButton.insertAdjacentElement("afterend", button);
    button.addEventListener("click", () => setEnabled(!enabled));
  };

  const observeQuestion = () => {
    const element = questionElement();
    if (!element || observer) return;

    observer = new MutationObserver(() => {
      if (rendering || !enabled || getCurrentLanguage() !== "ja") return;
      window.setTimeout(render, 0);
    });
    observer.observe(element, { childList: true, characterData: true, subtree: true });
  };

  document.addEventListener("DOMContentLoaded", () => {
    addButton();
    observeQuestion();

    try {
      enabled = localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      enabled = false;
    }
    updateButton();
    if (enabled) window.setTimeout(render, 0);

    document.getElementById("lang-ja")?.addEventListener("click", () => {
      window.setTimeout(() => enabled && render(), 0);
    });
    document.getElementById("lang-en")?.addEventListener("click", () => {
      window.setTimeout(updateButton, 0);
    });
    document.getElementById("toggle-ruby")?.addEventListener("click", () => {
      window.setTimeout(() => enabled && render(), 0);
    });
    document.getElementById("prev-question")?.addEventListener("click", () => {
      window.setTimeout(() => enabled && render(), 0);
    });
    document.getElementById("next-question")?.addEventListener("click", () => {
      window.setTimeout(() => enabled && render(), 0);
    });
    document.getElementById("btn-start-session")?.addEventListener("click", () => {
      window.setTimeout(() => enabled && render(), 0);
    });
  });

  window.refreshEasyJapanese = render;
})();
