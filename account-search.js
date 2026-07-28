(() => {
  const ACCOUNT_GUIDE = {
    "現金": ["げんきん", "genkin", "Cash"],
    "普通預金": ["ふつうよきん", "futsuu yokin", "Ordinary Deposit"],
    "当座預金": ["とうざよきん", "touza yokin", "Checking Account"],
    "売掛金": ["うりかけきん", "urikakekin", "Accounts Receivable"],
    "買掛金": ["かいかけきん", "kaikakekin", "Accounts Payable"],
    "未収入金": ["みしゅうにゅうきん", "mishu nyuukin", "Other Receivables"],
    "未払金": ["みばらいきん", "mibaraikin", "Other Payables"],
    "前払金": ["まえばらいきん", "maebaraikin", "Advance Payments"],
    "前受金": ["まえうけきん", "maeukekin", "Advances Received"],
    "仮払金": ["かりばらいきん", "karibaraikin", "Temporary Payments"],
    "仮受金": ["かりうけきん", "kariukekin", "Temporary Receipts"],
    "立替金": ["たてかえきん", "tatekaekin", "Payments on Behalf"],
    "借入金": ["かりいれきん", "kariirekin", "Loans Payable"],
    "貸付金": ["かしつけきん", "kashitsukekin", "Loans Receivable"],
    "売上": ["うりあげ", "uriage", "Sales Revenue"],
    "仕入": ["しいれ", "shiire", "Purchases"],
    "給料": ["きゅうりょう", "kyuuryou", "Salaries"],
    "給与": ["きゅうよ", "kyuuyo", "Payroll"],
    "旅費交通費": ["りょひこうつうひ", "ryohi koutsuuhi", "Travel and Transportation"],
    "通信費": ["つうしんひ", "tsuushinhi", "Communication Expense"],
    "水道光熱費": ["すいどうこうねつひ", "suidou kounetsuhi", "Utilities Expense"],
    "消耗品費": ["しょうもうひんひ", "shoumouhinhi", "Supplies Expense"],
    "広告宣伝費": ["こうこくせんでんひ", "koukoku sendenhi", "Advertising Expense"],
    "支払手数料": ["しはらいてすうりょう", "shiharai tesuuryou", "Commission Expense"],
    "受取手数料": ["うけとりてすうりょう", "uketori tesuuryou", "Commission Income"],
    "支払利息": ["しはらいりそく", "shiharai risoku", "Interest Expense"],
    "受取利息": ["うけとりりそく", "uketori risoku", "Interest Income"],
    "租税公課": ["そぜいこうか", "sozei kouka", "Taxes and Dues"],
    "雑費": ["ざっぴ", "zappi", "Miscellaneous Expense"],
    "雑収入": ["ざつしゅうにゅう", "zatsu shuunyuu", "Miscellaneous Income"],
    "備品": ["びひん", "bihin", "Equipment"],
    "建物": ["たてもの", "tatemono", "Buildings"],
    "土地": ["とち", "tochi", "Land"],
    "車両運搬具": ["しゃりょううんぱんぐ", "sharyou unpangu", "Vehicles"],
    "減価償却費": ["げんかしょうきゃくひ", "genka shoukyakuhi", "Depreciation Expense"],
    "資本金": ["しほんきん", "shihonkin", "Capital Stock"],
    "繰越利益剰余金": ["くりこしりえきじょうよきん", "kurikoshi rieki jouyokin", "Retained Earnings"]
  };

  const normalize = (value) => String(value || "")
    .normalize("NFKC").toLowerCase().replace(/[\s・･_-]/g, "");

  const optionItems = (select) => Array.from(select.options).map((option) => {
    const label = option.textContent.trim();
    const guide = ACCOUNT_GUIDE[label] || [];
    return {
      value: option.value,
      label,
      reading: guide[0] || option.dataset.reading || "",
      romaji: guide[1] || option.dataset.romaji || "",
      english: guide[2] || option.dataset.english || ""
    };
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
    input.placeholder = "科目名・よみ・英語で検索";
    input.setAttribute("aria-label", "勘定科目を科目名、読み、ローマ字、英語で検索");
    input.setAttribute("aria-expanded", "false");

    const guideDisplay = document.createElement("div");
    guideDisplay.className = "account-selected-guide";
    guideDisplay.setAttribute("aria-live", "polite");

    const list = document.createElement("div");
    list.className = "account-search-list";
    list.hidden = true;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(input, guideDisplay, list, select);

    const showGuide = (item) => {
      const parts = [item.reading, item.english].filter(Boolean);
      guideDisplay.textContent = parts.join(" / ");
      guideDisplay.hidden = parts.length === 0;
    };

    const syncFromSelect = () => {
      const selected = select.options[select.selectedIndex];
      const item = optionItems(select).find((candidate) => candidate.value === selected?.value);
      input.value = item?.value ? item.label : "";
      showGuide(item || {});
    };

    const close = () => {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
    };

    const choose = (item) => {
      select.value = item.value;
      input.value = item.label;
      showGuide(item);
      select.dispatchEvent(new Event("change", { bubbles: true }));
      close();
    };

    const render = () => {
      const query = normalize(input.value);
      const items = optionItems(select)
        .filter((item) => item.value)
        .filter((item) => !query || [item.label, item.reading, item.romaji, item.english]
          .some((value) => normalize(value).includes(query)))
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

          const primary = document.createElement("span");
          primary.className = "account-option-primary";
          appendRuby(primary, item.label, item.reading);
          button.appendChild(primary);

          if (item.english) {
            const secondary = document.createElement("span");
            secondary.className = "account-option-english";
            secondary.textContent = item.english;
            button.appendChild(secondary);
          }

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
      guideDisplay.hidden = true;
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
      const value = normalize(input.value);
      const exact = optionItems(select).find((item) =>
        [item.label, item.reading, item.romaji, item.english].some((candidate) => normalize(candidate) === value)
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
    .account-combobox{position:relative;min-width:0}.account-search-input,.account-selected-guide{display:none}.account-search-list{display:none}
    @media(max-width:760px){
      .account-combobox>select.account-select{display:none!important}
      .account-search-input{display:block;width:100%;height:38px;min-width:0;border:1px solid var(--border-soft,#d9e0ea);border-radius:8px;background:#fff;padding:0 22px 0 7px;font:inherit;font-size:.78rem;color:inherit;outline:none}
      .account-search-input:focus{border-color:var(--daily-blue,#1769e0);box-shadow:0 0 0 3px rgba(23,105,224,.12)}
      .account-selected-guide{display:block;min-height:15px;margin-top:1px;padding-left:7px;font-size:.6rem;line-height:1.2;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .account-selected-guide[hidden]{visibility:hidden}
      .account-combobox:after{content:"⌄";position:absolute;right:6px;top:8px;color:#7a8494;font-size:.75rem;pointer-events:none}
      .account-search-list{display:block;position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:1200;max-height:260px;overflow:auto;border:1px solid #dfe5ee;border-radius:10px;background:#fff;box-shadow:0 12px 28px rgba(16,35,63,.16);padding:4px}
      .account-search-list[hidden]{display:none}
      .account-search-option{display:flex;width:100%;min-height:52px;border:0;background:transparent;border-radius:7px;padding:9px 8px;text-align:left;color:#1d2939;cursor:pointer;flex-direction:column;justify-content:center;gap:3px}
      .account-option-primary{font-size:.82rem}.account-option-primary ruby{ruby-position:over}.account-option-primary rt{font-size:.58em;color:#667085}
      .account-option-english{font-size:.64rem;color:#667085;line-height:1.2}
      .account-search-option:hover,.account-search-option:focus{background:#eef5ff;color:#1769e0}
      .account-search-empty{padding:10px;color:#7a8494;font-size:.75rem;text-align:center}
      body.daily-dark .account-search-input{background:#172033;border-color:#344158;color:#edf4ff}
      body.daily-dark .account-selected-guide,body.daily-dark .account-option-english{color:#aebbd0}
      body.daily-dark .account-search-list{background:#172033;border-color:#344158}
      body.daily-dark .account-search-option{color:#edf4ff}
      body.daily-dark .account-option-primary rt{color:#aebbd0}
      body.daily-dark .account-search-option:hover,body.daily-dark .account-search-option:focus{background:#233552}
    }
    @media(max-width:390px){.account-search-input{font-size:.7rem;padding-left:5px;padding-right:18px}.account-selected-guide{font-size:.56rem;padding-left:5px}}
  `;
  document.head.appendChild(style);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceAll, { once: true });
  else enhanceAll();

  new MutationObserver(enhanceAll).observe(document.documentElement, { childList: true, subtree: true });
})();
