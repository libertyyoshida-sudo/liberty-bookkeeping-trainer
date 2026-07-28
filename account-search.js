(() => {
  const ACCOUNT_GUIDE = {
    "現金": ["げんきん", "Cash"],
    "普通預金": ["ふつうよきん", "Ordinary Deposit"],
    "当座預金": ["とうざよきん", "Checking Account"],
    "売掛金": ["うりかけきん", "Accounts Receivable"],
    "買掛金": ["かいかけきん", "Accounts Payable"],
    "未収入金": ["みしゅうにゅうきん", "Other Receivables"],
    "未払金": ["みばらいきん", "Other Payables"],
    "前払金": ["まえばらいきん", "Advance Payments"],
    "前受金": ["まえうけきん", "Advances Received"],
    "仮払金": ["かりばらいきん", "Temporary Payments"],
    "仮受金": ["かりうけきん", "Temporary Receipts"],
    "立替金": ["たてかえきん", "Payments on Behalf"],
    "借入金": ["かりいれきん", "Loans Payable"],
    "貸付金": ["かしつけきん", "Loans Receivable"],
    "売上": ["うりあげ", "Sales Revenue"],
    "仕入": ["しいれ", "Purchases"],
    "給料": ["きゅうりょう", "Salaries"],
    "給与": ["きゅうよ", "Payroll"],
    "旅費交通費": ["りょひこうつうひ", "Travel and Transportation"],
    "通信費": ["つうしんひ", "Communication Expense"],
    "水道光熱費": ["すいどうこうねつひ", "Utilities Expense"],
    "消耗品費": ["しょうもうひんひ", "Supplies Expense"],
    "広告宣伝費": ["こうこくせんでんひ", "Advertising Expense"],
    "支払手数料": ["しはらいてすうりょう", "Commission Expense"],
    "受取手数料": ["うけとりてすうりょう", "Commission Income"],
    "支払利息": ["しはらいりそく", "Interest Expense"],
    "受取利息": ["うけとりりそく", "Interest Income"],
    "租税公課": ["そぜいこうか", "Taxes and Dues"],
    "雑費": ["ざっぴ", "Miscellaneous Expense"],
    "雑収入": ["ざつしゅうにゅう", "Miscellaneous Income"],
    "備品": ["びひん", "Equipment"],
    "建物": ["たてもの", "Buildings"],
    "土地": ["とち", "Land"],
    "車両運搬具": ["しゃりょううんぱんぐ", "Vehicles"],
    "減価償却費": ["げんかしょうきゃくひ", "Depreciation Expense"],
    "資本金": ["しほんきん", "Capital Stock"],
    "繰越利益剰余金": ["くりこしりえきじょうよきん", "Retained Earnings"]
  };

  let activeSelect = null;
  let sheet = null;
  let optionList = null;
  let sheetTitle = null;

  const getItems = (select) => Array.from(select.options).map((option) => {
    const label = option.textContent.trim();
    const guide = ACCOUNT_GUIDE[label] || [];
    return {
      value: option.value,
      label,
      reading: guide[0] || option.dataset.reading || "",
      english: guide[1] || option.dataset.english || ""
    };
  });

  const fieldName = (select) => {
    const isDebit = select.id.startsWith("debit-");
    const row = select.id.match(/-(\d+)$/)?.[1] || "";
    return `${row ? `${row}行目 ` : ""}${isDebit ? "借方" : "貸方"}の勘定科目`;
  };

  const closeSheet = () => {
    if (!sheet) return;
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("account-picker-open");
    activeSelect = null;
  };

  const chooseItem = (item) => {
    if (!activeSelect) return;
    activeSelect.value = item.value;
    activeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    closeSheet();
  };

  const renderOptions = () => {
    if (!activeSelect || !optionList) return;
    optionList.innerHTML = "";

    getItems(activeSelect).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "account-picker-option";
      button.dataset.value = item.value;

      if (item.value === activeSelect.value) {
        button.classList.add("is-selected");
        button.setAttribute("aria-current", "true");
      }

      const main = document.createElement("span");
      main.className = "account-picker-option-main";
      main.textContent = item.value ? item.label : "選択しない";
      button.appendChild(main);

      const subText = [item.reading, item.english].filter(Boolean).join(" / ");
      if (subText) {
        const sub = document.createElement("span");
        sub.className = "account-picker-option-sub";
        sub.textContent = subText;
        button.appendChild(sub);
      }

      button.addEventListener("click", () => chooseItem(item));
      optionList.appendChild(button);
    });

    const selected = optionList.querySelector(".is-selected");
    requestAnimationFrame(() => selected?.scrollIntoView({ block: "center" }));
  };

  const openSheet = (select) => {
    activeSelect = select;
    sheetTitle.textContent = fieldName(select);
    renderOptions();
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.classList.add("account-picker-open");
  };

  const createSheet = () => {
    if (sheet) return;

    sheet = document.createElement("div");
    sheet.id = "account-picker-sheet";
    sheet.className = "account-picker-sheet";
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML = `
      <div class="account-picker-backdrop" data-account-picker-close></div>
      <section class="account-picker-panel" role="dialog" aria-modal="true" aria-labelledby="account-picker-title">
        <div class="account-picker-handle" aria-hidden="true"></div>
        <div class="account-picker-header">
          <div>
            <div class="account-picker-kicker">勘定科目を選択</div>
            <h2 id="account-picker-title"></h2>
          </div>
          <button type="button" class="account-picker-close" data-account-picker-close aria-label="閉じる">×</button>
        </div>
        <div class="account-picker-list"></div>
      </section>
    `;

    document.body.appendChild(sheet);
    optionList = sheet.querySelector(".account-picker-list");
    sheetTitle = sheet.querySelector("#account-picker-title");
    sheet.querySelectorAll("[data-account-picker-close]").forEach((element) => {
      element.addEventListener("click", closeSheet);
    });
  };

  const syncButton = (select, button) => {
    const selected = select.options[select.selectedIndex];
    const label = selected?.value ? selected.textContent.trim() : "勘定科目を選択";
    button.querySelector(".account-picker-button-label").textContent = label;
    button.classList.toggle("has-value", Boolean(selected?.value));
  };

  const enhance = (select) => {
    if (select.dataset.accountPickerReady === "true") return;
    select.dataset.accountPickerReady = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "account-picker-field";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "account-picker-button";
    button.innerHTML = `
      <span class="account-picker-button-label">勘定科目を選択</span>
      <span class="account-picker-button-arrow" aria-hidden="true">›</span>
    `;
    button.setAttribute("aria-label", fieldName(select));
    button.addEventListener("click", () => openSheet(select));

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(button, select);

    select.addEventListener("change", () => syncButton(select, button));
    new MutationObserver(() => syncButton(select, button)).observe(select, {
      childList: true,
      subtree: true,
      attributes: true
    });
    syncButton(select, button);
  };

  const enhanceAll = () => {
    createSheet();
    document.querySelectorAll("select.account-select").forEach(enhance);
  };

  const style = document.createElement("style");
  style.textContent = `
    .account-picker-button{display:none}
    @media(max-width:760px){
      body.account-picker-open{overflow:hidden}
      .account-picker-field{min-width:0}
      .account-picker-field>select.account-select{display:none!important}
      .account-picker-button{display:flex;width:100%;min-height:46px;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--border-soft,#d9e0ea);border-radius:10px;background:#fff;padding:8px 10px;color:#7a8494;font:inherit;font-size:.8rem;text-align:left;cursor:pointer}
      .account-picker-button.has-value{color:#1d2939;font-weight:700;border-color:#b8c5d8}
      .account-picker-button:focus{outline:none;border-color:var(--daily-blue,#1769e0);box-shadow:0 0 0 3px rgba(23,105,224,.12)}
      .account-picker-button-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .account-picker-button-arrow{flex:0 0 auto;font-size:1.25rem;line-height:1;color:#7a8494}
      .account-picker-sheet{position:fixed;inset:0;z-index:5000;visibility:hidden;pointer-events:none}
      .account-picker-sheet.is-open{visibility:visible;pointer-events:auto}
      .account-picker-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.48);opacity:0;transition:opacity .18s ease}
      .account-picker-sheet.is-open .account-picker-backdrop{opacity:1}
      .account-picker-panel{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;max-height:82dvh;border-radius:20px 20px 0 0;background:#fff;box-shadow:0 -12px 40px rgba(15,23,42,.22);transform:translateY(102%);transition:transform .22s ease;padding-bottom:max(12px,env(safe-area-inset-bottom))}
      .account-picker-sheet.is-open .account-picker-panel{transform:translateY(0)}
      .account-picker-handle{width:42px;height:5px;border-radius:999px;background:#d0d5dd;margin:9px auto 3px}
      .account-picker-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px 12px;border-bottom:1px solid #eaecf0}
      .account-picker-kicker{font-size:.68rem;color:#667085}
      #account-picker-title{margin:2px 0 0;font-size:1rem;color:#101828}
      .account-picker-close{width:40px;height:40px;border:0;border-radius:999px;background:#f2f4f7;color:#344054;font-size:1.5rem;line-height:1;cursor:pointer}
      .account-picker-list{overflow-y:auto;padding:8px 10px 12px;-webkit-overflow-scrolling:touch}
      .account-picker-option{display:flex;width:100%;min-height:58px;flex-direction:column;justify-content:center;gap:3px;border:0;border-bottom:1px solid #eef0f3;background:transparent;padding:10px 12px;text-align:left;color:#1d2939;cursor:pointer}
      .account-picker-option:first-child{border-radius:10px 10px 0 0}
      .account-picker-option:last-child{border-bottom:0;border-radius:0 0 10px 10px}
      .account-picker-option.is-selected{background:#eef5ff;color:#1769e0}
      .account-picker-option-main{font-size:.92rem;font-weight:700}
      .account-picker-option-sub{font-size:.68rem;line-height:1.35;color:#667085}
      .account-picker-option.is-selected .account-picker-option-sub{color:#3b6fb6}
      body.daily-dark .account-picker-button{background:#172033;border-color:#344158;color:#aebbd0}
      body.daily-dark .account-picker-button.has-value{color:#edf4ff}
      body.daily-dark .account-picker-panel{background:#172033}
      body.daily-dark .account-picker-header{border-color:#344158}
      body.daily-dark #account-picker-title,body.daily-dark .account-picker-option{color:#edf4ff}
      body.daily-dark .account-picker-kicker,body.daily-dark .account-picker-option-sub{color:#aebbd0}
      body.daily-dark .account-picker-close{background:#233552;color:#edf4ff}
      body.daily-dark .account-picker-option{border-color:#29364a}
      body.daily-dark .account-picker-option.is-selected{background:#233552;color:#8fc1ff}
    }
    @media(min-width:761px){.account-picker-field{display:contents}}
  `;
  document.head.appendChild(style);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sheet?.classList.contains("is-open")) closeSheet();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceAll, { once: true });
  } else {
    enhanceAll();
  }

  new MutationObserver(enhanceAll).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
