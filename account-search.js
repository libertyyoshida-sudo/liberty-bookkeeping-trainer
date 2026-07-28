(() => {
  const READING_ALIASES = {
    "現金": "げんきん", "普通預金": "ふつうよきん", "当座預金": "とうざよきん",
    "売掛金": "うりかけきん", "買掛金": "かいかけきん", "未収入金": "みしゅうにゅうきん",
    "未払金": "みばらいきん", "前払金": "まえばらいきん", "前受金": "まえうけきん",
    "仮払金": "かりばらいきん", "仮受金": "かりうけきん", "立替金": "たてかえきん",
    "借入金": "かりいれきん", "貸付金": "かしつけきん", "売上": "うりあげ",
    "仕入": "しいれ", "給料": "きゅうりょう", "給与": "きゅうよ",
    "旅費交通費": "りょひこうつうひ", "通信費": "つうしんひ", "水道光熱費": "すいどうこうねつひ",
    "消耗品費": "しょうもうひんひ", "広告宣伝費": "こうこくせんでんひ", "支払手数料": "しはらいてすうりょう",
    "受取手数料": "うけとりてすうりょう", "支払利息": "しはらいりそく", "受取利息": "うけとりりそく",
    "租税公課": "そぜいこうか", "雑費": "ざっぴ", "雑収入": "ざつしゅうにゅう",
    "備品": "びひん", "建物": "たてもの", "土地": "とち", "車両運搬具": "しゃりょううんぱんぐ",
    "減価償却費": "げんかしょうきゃくひ", "資本金": "しほんきん", "繰越利益剰余金": "くりこしりえきじょうよきん"
  };

  const normalize = (value) => String(value || "")
    .normalize("NFKC").toLowerCase().replace(/[\s・･]/g, "");

  const optionItems = (select) => Array.from(select.options).map((option) => {
    const label = option.textContent.trim();
    return { value: option.value, label, reading: READING_ALIASES[label] || option.dataset.reading || "" };
  });

  const appendRuby = (parent, label, reading) => {
    const ruby = document.createElement("ruby");
    const rb = document.createElement("rb");
    rb.textContent = label;
    ruby.appendChild(rb);
    if (reading) {
      const rt = document.createElement("rt");
      rt.textContent = reading;
      ruby.appendChild(rt);
    }
    parent.appendChild(ruby);
  };

  const enhance = (select) => {
    if (select.dataset.accountSearchReady === "true") return;
    select.dataset.accountSearchReady = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "account-combobox";

    const input = document.createElement("input");
    input.type = "search";
    input.className = "account-search-input";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "科目名・よみで検索";
    input.setAttribute("aria-label", "勘定科目を科目名または読みで検索");
    input.setAttribute("aria-expanded", "false");

    const readingDisplay = document.createElement("div");
    readingDisplay.className = "account-selected-reading";
    readingDisplay.setAttribute("aria-live", "polite");

    const list = document.createElement("div");
    list.className = "account-search-list";
    list.hidden = true;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(input, readingDisplay, list, select);

    const syncFromSelect = () => {
      const selected = select.options[select.selectedIndex];
      const label = selected?.value ? selected.textContent.trim() : "";
      const reading = label ? (READING_ALIASES[label] || selected?.dataset.reading || "") : "";
      input.value = label;
      readingDisplay.textContent = reading;
      readingDisplay.hidden = !reading;
    };

    const close = () => {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
    };

    const choose = (item) => {
      select.value = item.value;
      input.value = item.label;
      readingDisplay.textContent = item.reading;
      readingDisplay.hidden = !item.reading;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      close();
    };

    const render = () => {
      const query = normalize(input.value);
      const items = optionItems(select)
        .filter((item) => item.value)
        .filter((item) => !query || normalize(item.label).includes(query) || normalize(item.reading).includes(query))
        .slice(0, 8);

      list.innerHTML = "";
      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "account-search-empty";
        empty.textContent = "候補がありません";
        list.appendChild(empty);
      } else {
        items.forEach((item) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "account-search-option";
          appendRuby(button, item.label, item.reading);
          button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            choose(item);
          });
          list.appendChild(button);
        });
      }

      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };

    input.addEventListener("focus", render);
    input.addEventListener("input", () => {
      readingDisplay.hidden = true;
      render();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
        input.blur();
      } else if (event.key === "Enter") {
        const first = list.querySelector(".account-search-option");
        if (first) {
          event.preventDefault();
          first.dispatchEvent(new PointerEvent("pointerdown"));
        }
      }
    });
    input.addEventListener("blur", () => setTimeout(() => {
      const exact = optionItems(select).find((item) =>
        normalize(item.label) === normalize(input.value) || normalize(item.reading) === normalize(input.value)
      );
      if (exact) choose(exact); else syncFromSelect();
      close();
    }, 100));

    select.addEventListener("change", syncFromSelect);
    new MutationObserver(syncFromSelect).observe(select, { childList: true, subtree: true, attributes: true });
    syncFromSelect();
  };

  const enhanceAll = () => document.querySelectorAll("select.account-select").forEach(enhance);

  const style = document.createElement("style");
  style.textContent = `
    .account-combobox{position:relative;min-width:0}.account-search-input,.account-selected-reading{display:none}.account-search-list{display:none}
    @media(max-width:760px){
      .account-combobox>select.account-select{display:none!important}
      .account-search-input{display:block;width:100%;height:38px;min-width:0;border:1px solid var(--border-soft,#d9e0ea);border-radius:8px;background:#fff;padding:0 22px 0 7px;font:inherit;font-size:.78rem;color:inherit;outline:none}
      .account-search-input:focus{border-color:var(--daily-blue,#1769e0);box-shadow:0 0 0 3px rgba(23,105,224,.12)}
      .account-selected-reading{display:block;min-height:15px;margin-top:1px;padding-left:7px;font-size:.62rem;line-height:1.2;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .account-selected-reading[hidden]{visibility:hidden}
      .account-combobox:after{content:"⌄";position:absolute;right:6px;top:8px;color:#7a8494;font-size:.75rem;pointer-events:none}
      .account-search-list{display:block;position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:1200;max-height:240px;overflow:auto;border:1px solid #dfe5ee;border-radius:10px;background:#fff;box-shadow:0 12px 28px rgba(16,35,63,.16);padding:4px}
      .account-search-list[hidden]{display:none}
      .account-search-option{display:block;width:100%;min-height:46px;border:0;background:transparent;border-radius:7px;padding:9px 8px;text-align:left;font-size:.82rem;color:#1d2939;cursor:pointer}
      .account-search-option ruby{ruby-position:over}.account-search-option rt{font-size:.58em;color:#667085}
      .account-search-option:hover,.account-search-option:focus{background:#eef5ff;color:#1769e0}
      .account-search-empty{padding:10px;color:#7a8494;font-size:.75rem;text-align:center}
      body.daily-dark .account-search-input{background:#172033;border-color:#344158;color:#edf4ff}
      body.daily-dark .account-selected-reading{color:#aebbd0}
      body.daily-dark .account-search-list{background:#172033;border-color:#344158}
      body.daily-dark .account-search-option{color:#edf4ff}
      body.daily-dark .account-search-option rt{color:#aebbd0}
      body.daily-dark .account-search-option:hover,body.daily-dark .account-search-option:focus{background:#233552}
    }
    @media(max-width:390px){.account-search-input{font-size:.72rem;padding-left:5px;padding-right:18px}.account-selected-reading{font-size:.58rem;padding-left:5px}}
  `;
  document.head.appendChild(style);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceAll, { once: true });
  else enhanceAll();

  new MutationObserver(enhanceAll).observe(document.documentElement, { childList: true, subtree: true });
})();
