(() => {
  const TERMS = {
    "繰越利益剰余金": "くりこしりえきじょうよきん",
    "減価償却費": "げんかしょうきゃくひ",
    "車両運搬具": "しゃりょううんぱんぐ",
    "水道光熱費": "すいどうこうねつひ",
    "旅費交通費": "りょひこうつうひ",
    "広告宣伝費": "こうこくせんでんひ",
    "支払手数料": "しはらいてすうりょう",
    "受取手数料": "うけとりてすうりょう",
    "借方勘定科目": "かりかたかんじょうかもく",
    "貸方勘定科目": "かしかたかんじょうかもく",
    "勘定科目": "かんじょうかもく",
    "売掛金": "うりかけきん",
    "買掛金": "かいかけきん",
    "未収入金": "みしゅうにゅうきん",
    "未払金": "みばらいきん",
    "前払金": "まえばらいきん",
    "前受金": "まえうけきん",
    "仮払金": "かりばらいきん",
    "仮受金": "かりうけきん",
    "立替金": "たてかえきん",
    "借入金": "かりいれきん",
    "貸付金": "かしつけきん",
    "普通預金": "ふつうよきん",
    "当座預金": "とうざよきん",
    "支払利息": "しはらいりそく",
    "受取利息": "うけとりりそく",
    "消耗品費": "しょうもうひんひ",
    "租税公課": "そぜいこうか",
    "資本金": "しほんきん",
    "模範仕訳": "もはんしわけ",
    "仕訳": "しわけ",
    "借方": "かりかた",
    "貸方": "かしかた",
    "現金": "げんきん",
    "売上": "うりあげ",
    "仕入": "しいれ",
    "給料": "きゅうりょう",
    "給与": "きゅうよ",
    "通信費": "つうしんひ",
    "雑収入": "ざつしゅうにゅう",
    "雑費": "ざっぴ",
    "備品": "びひん",
    "建物": "たてもの",
    "土地": "とち",
    "金額": "きんがく"
  };

  const sortedTerms = Object.keys(TERMS).sort((a, b) => b.length - a.length);
  const targetSelector = [
    '[data-i18n="entry-col-debit"]',
    '[data-i18n="entry-col-debit-amount"]',
    '[data-i18n="entry-col-credit"]',
    '[data-i18n="entry-col-credit-amount"]',
    '[data-i18n="toggle-main"]',
    '[data-i18n="answer-title"]',
    '#answer-ja'
  ].join(',');

  const isJapaneseMode = () => document.getElementById('lang-ja')?.classList.contains('active') !== false;

  const makeRuby = (term) => {
    const ruby = document.createElement('ruby');
    const rb = document.createElement('rb');
    const rt = document.createElement('rt');
    rb.textContent = term;
    rt.textContent = TERMS[term];
    ruby.append(rb, rt);
    return ruby;
  };

  const decorateTextNode = (node) => {
    const text = node.nodeValue || '';
    if (!text.trim()) return;

    let cursor = 0;
    const fragment = document.createDocumentFragment();

    while (cursor < text.length) {
      let matchedTerm = '';
      let matchedIndex = -1;

      for (const term of sortedTerms) {
        const index = text.indexOf(term, cursor);
        if (index === -1) continue;
        if (matchedIndex === -1 || index < matchedIndex || (index === matchedIndex && term.length > matchedTerm.length)) {
          matchedIndex = index;
          matchedTerm = term;
        }
      }

      if (matchedIndex === -1) {
        fragment.appendChild(document.createTextNode(text.slice(cursor)));
        break;
      }

      if (matchedIndex > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, matchedIndex)));
      }
      fragment.appendChild(makeRuby(matchedTerm));
      cursor = matchedIndex + matchedTerm.length;
    }

    node.replaceWith(fragment);
  };

  const decorate = (element) => {
    if (!element || !isJapaneseMode()) return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest('ruby, rt, script, style, input, select, option')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(decorateTextNode);
  };

  const decorateAll = () => {
    if (!isJapaneseMode()) return;
    document.querySelectorAll(targetSelector).forEach(decorate);
  };

  let scheduled = false;
  const scheduleDecorate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorateAll();
    });
  };

  const style = document.createElement('style');
  style.textContent = `
    [data-i18n^="entry-col-"] ruby,
    [data-i18n="toggle-main"] ruby,
    [data-i18n="answer-title"] ruby,
    #answer-ja ruby { ruby-position: over; }
    [data-i18n^="entry-col-"] rt,
    [data-i18n="toggle-main"] rt,
    [data-i18n="answer-title"] rt,
    #answer-ja rt { font-size: .55em; color: var(--text-muted, #667085); }
    #answer-ja { white-space: pre-wrap; line-height: 1.85; }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleDecorate, { once: true });
  } else {
    scheduleDecorate();
  }

  document.getElementById('lang-ja')?.addEventListener('click', () => setTimeout(scheduleDecorate, 0));
  document.getElementById('lang-en')?.addEventListener('click', () => setTimeout(scheduleDecorate, 0));

  new MutationObserver(scheduleDecorate).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
