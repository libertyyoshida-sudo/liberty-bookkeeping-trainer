const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

// Supabaseクライアント初期化
let supabaseClient = null;

// ✅ v2 は createClient を import するのが正しい
console.log("Supabase loaded:", window.supabase);
console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_ANON_KEY exists:", !!SUPABASE_ANON_KEY);

if (window.supabase?.createClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
    },
  });
  console.log("Supabase client initialized ✅", supabaseClient);
} else {
  console.error("Supabase library not loaded or config missing ❌");
}

// 画面文言の多言語対応
const i18n = {
  ja: {
    'app-title': 'Liberty Bookkeeping Trainer',
    'app-subtitle': '留学生向け 簿記仕訳トレーニング 2.0',
    'practice-pill': 'Practice',
    'question-label-prefix': '問題',       // 「問題 1 / 10」の「問題」部分
    'filter-category': 'カテゴリ:',
    'filter-count': '問題数:',
    'filter-start': '出題開始',
    'filter-unlearned': '未学習のみ',
    'filter-not-cleared': '未修得のみ',
    'filter-drill': '特訓モード',
    'drill-info': '特訓中: 連続3回正解でクリア',
    'drill-cleared': '★クリア済',
    'toggle-main': '借方・貸方の科目と金額を入力してください。',
    'toggle-random': 'ランダム出題',
    'hint-text':
      '行ごとに「借方勘定科目・金額」「貸方勘定科目・金額」を入力します。\n不要な欄は科目を「空欄」のまま、金額も空欄にしておいてください。',
    'entry-col-row': '行',
    'entry-col-debit': '借方勘定科目',
    'entry-col-debit-amount': '金額',
    'entry-col-credit': '貸方勘定科目',
    'entry-col-credit-amount': '金額',
    'btn-prev': '⏮ 前の問題へ',
    'btn-check': '✔ 答え合わせ',
    'btn-next': '⏭ 次の問題へ',
    'answer-title': '模範仕訳 / Model Answer',
    'answer-note': '※ 科目名と金額が合致していれば正解です（行の順番は問いません）。',
    'progress-title': '進捗 / Progress',
    'history-title': '直近の学習履歴',
    'history-not-logged-in': 'ログインすると直近の解答履歴が表示されます。',
    'history-none': 'まだ履歴がありません。',
    'footer': '© Liberty Co., Ltd. Bookkeeping Trainer 2.0',
    'progress-title': '進捗 / Progress',
    'progress-help':
      '・「出題開始」で選択した条件の問題セットを開始します。\n' +
      '・「答え合わせ」で自動判定します。\n' +
      '・ランダム出題をONにすると、順番をシャッフルします。\n' +
      '・日本語 / 英語はいつでも切り替え可能です。',
    'history-title': '直近の学習履歴',

    // メッセージ系
    'msg-input-required': '科目と金額を入力してください。',
    'msg-not-balanced': '借方合計と貸方合計が一致していません。もう一度確認してください。',
    'msg-correct': '◎ 正解です！ とても良いです。',
    'msg-wrong': '× 惜しいです。模範仕訳を確認してみましょう。',
    'msg-drill-cleared': '🎉 この問題はクリアです！(3回連続正解)',
    'msg-drill-reset': '💦 不正解のためカウントリセット',
    'score': (correct, total) => `正解 ${correct} / ${total}`,
    'filter-cat-all': 'すべてのカテゴリ',
    'filter-count-max': (n) => `最大 ${n}問`,
    'filter-count-all': '全件',
    'ai-explain-title': 'AI解説（この問題）',
    'btn-ai-explain': 'この問題を解説して',
    'btn-ai-clear': 'クリア',
    'ai-note': '※AIの解説は学習補助です。最終判断はテキスト等で確認してください。'
  },
  en: {
    'app-title': 'Liberty Bookkeeping Trainer',
    'app-subtitle': 'Bookkeeping Journal Entry Trainer for International Students & Practitioners',
    'practice-pill': 'Practice',
    'question-label-prefix': 'Question',
    'filter-category': 'Category:',
    'filter-count': 'Number of questions:',
    'filter-start': 'Start',
    'filter-unlearned': 'Unlearned only',
    'filter-not-cleared': 'Not cleared only',
    'filter-drill': 'Drill Mode',
    'drill-info': 'Drill: 3 consecutive correct answers to clear',
    'drill-cleared': '★Cleared',
    'toggle-main': 'Enter the accounts and amounts for debit and credit.',
    'toggle-random': 'Random order',
    'hint-text':
      'For each row, enter “debit account / amount” and “credit account / amount”.\nIf a row is not needed, leave both the account and amount blank.',
    'entry-col-row': 'Row',
    'entry-col-debit': 'Debit account',
    'entry-col-debit-amount': 'Amount',
    'entry-col-credit': 'Credit account',
    'entry-col-credit-amount': 'Amount',
    'btn-prev': '⏮ Previous',
    'btn-check': '✔ Check answer',
    'btn-next': '⏭ Next',
    'answer-title': 'Model Answer',
    'answer-note': 'If both account names and amounts match, it is correct (row order does not matter).',
    'progress-title': 'Progress',
    'history-title': 'Recent study history',
    'history-not-logged-in': 'Log in to see your recent answer history.',
    'history-none': 'No history yet.',
    'footer': '© Liberty Co., Ltd. Bookkeeping Trainer 2.0',
    'progress-title': 'Progress',
    'progress-help':
      '・Click "Start" to begin questions with the selected conditions.\n' +
      '・Click "Check answer" to auto-grade your entry.\n' +
      '・Turn on "Random order" to shuffle questions.\n' +
      '・You can switch between Japanese / English at any time.',
    'history-title': 'Recent study history',

    'msg-input-required': 'Please enter both account names and amounts.',
    'msg-not-balanced': 'Debit total and credit total do not match. Please check again.',
    'msg-correct': '◎ Correct! Well done.',
    'msg-wrong': '× Almost. Check the model journal entry.',
    'msg-drill-cleared': '🎉 Question Cleared! (3 in a row)',
    'msg-drill-reset': '💦 Count reset due to wrong answer',
    'score': (correct, total) => `Correct ${correct} / ${total}`,
    'filter-cat-all': 'All Categories',
    'filter-count-max': (n) => `Max ${n} Qs`,
    'filter-count-all': 'All',
    'ai-explain-title': 'AI Explanation (This Question)',
    'btn-ai-explain': 'Explain this question',
    'btn-ai-clear': 'Clear',
    'ai-note': '* AI explanation is a study aid. Please verify with textbooks.'
  }
};

// ---------------------------
// グローバル状態
// ---------------------------
window.sessionUser = null;

// Supabase から取得する全問題
let allQuestions = [];

// 仕訳入力の行数（将来 5 行、6 行にしたければここを変える）
const ENTRY_ROW_COUNT = 4;   // 今は 4 行にしたい

// 今回の出題セット
let questions = [];

// 学習済みID管理
let learnedQuestionIds = new Set();
let clearedQuestionIds = new Set(); // 直近3回連続正解したID
// 特訓モード管理
let isDrillMode = false;
let drillStreaks = {}; // { id: count }
let drillCompletedIds = new Set();

// フォールバック用のハードコード問題
const hardcodedQuestions = [
  {
    id: "2-1",
    categoryJa: "日々の仕訳",
    categoryEn: "Daily entries",
    titleJa: "2-1 売上（現金＋ポイント）",
    titleEn: "2-1 Sales (cash + point)",
    questionJa:
      "商品を 1,100円で販売し、その代金のうち 100円をポイント利用、残り 1,000円を現金で受け取った。100円のポイントは他社が発行するポイントで後日入金される。",
    questionEn:
      "A product was sold for 1,100 yen. 100 yen was paid using points issued by another company (to be received later in cash), and the remaining 1,000 yen was received in cash.",
    solution: {
      debit: [
        { account: "売掛金", amount: 100 },
        { account: "現金", amount: 1000 }
      ],
      credit: [
        { account: "売上", amount: 1100 }
      ]
    },
    journalJa: "借方：売掛金 100　現金 1,000　/　貸方：売上 1,100",
    journalEn: "Debit: Accounts Receivable 100, Cash 1,000 / Credit: Sales 1,100",
    account_options: "現金,売掛金,売上"
  }
  // …必要なら他のハードコード問題にも account_options を追加
];

// デフォルトの勘定科目マスター（account_options 未設定の問題用）
const accountMaster = [
  "",
  "現金",
  "普通預金",
  "売掛金",
  "買掛金",
  "未払金",
  "仕入",
  "売上",
  "消耗品費"
];

// 英語用デフォルト
const accountMasterEn = [
  "",
  "Cash",
  "Ordinary Deposit",
  "Accounts Receivable",
  "Accounts Payable",
  "Accounts Payable (Other)",
  "Purchases",
  "Sales",
  "Supplies Expense"
];

    // ★ カテゴリの表示順をここで定義（グローバル）
const CATEGORY_ORDER = [
  "日々の仕訳",
  "月次の仕訳",
  "定期仕訳",
  "決算仕訳",
  "その他"
];

// 状態
let currentIndex = 0;
let currentLang = "ja";
let randomMode = false;
let historyStack = []; // 戻る用にインデックスを積む
let totalAnswered = 0;
let totalCorrect = 0;

// ルビ表示用
let rubyEnabled = false;
let kuroshiro = null;
let kuroshiroReady = false;
let kuroshiroInitPromise = null;

function initKuroshiro() {
  // すでに初期化済みならそのまま返す
  if (kuroshiroReady && kuroshiro) {
    return Promise.resolve();
  }

  // 初期化中なら、そのPromiseを返す
  if (kuroshiroInitPromise) {
    return kuroshiroInitPromise;
  }

  // 初期化処理をPromiseとして保持
  kuroshiroInitPromise = new Promise(async (resolve, reject) => {
    try {
      // Kuroshiroの読み込み確認
      if (typeof Kuroshiro === "undefined" && !window.Kuroshiro) {
        throw new Error("Kuroshiro library not loaded");
      }
      
      const KuroClass = window.Kuroshiro?.default || window.Kuroshiro;
      if (!KuroClass) {
        throw new Error("Kuroshiro class not found");
      }
      
      kuroshiro = new KuroClass();

      // Analyzer確認
      const AnalyzerClass = window.KuroshiroAnalyzerKuromoji?.default || 
                           window.KuroshiroAnalyzerKuromoji;
      if (!AnalyzerClass) {
        throw new Error("KuromojiAnalyzer not loaded");
      }

      const dictPath = "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/";  // ← CDNのパス
      const analyzer = new AnalyzerClass({ dictPath });

      await kuroshiro.init(analyzer);

      kuroshiroReady = true;
      console.log("Kuroshiro initialized ✅");
      resolve(true);

    } catch (e) {
      console.error("Kuroshiro init error:", e);
      kuroshiroInitPromise = null;
      reject(e);
    }
  });

  return kuroshiroInitPromise;
}

// Kuroshiro の furigana 出力「漢(かん)字」を <ruby>漢<rt>かん</rt>字</ruby> に変換
function furiganaTextToRubyHtml(str) {
  // 例: 商品(しょうひん)を → <ruby>商品<rt>しょうひん</rt></ruby>を
  return str.replace(
    /([一-龠々〆ヵヶ]+)\(([^)]+)\)/g,
    "<ruby>$1<rt>$2</rt></ruby>"
  );
}

// DOM 取得（後で埋まるので let で宣言だけしておく）
let questionLabel, categoryLabel, idLabel, randomLabel;
let questionTextJa, questionTextEn;
let langJaBtn, langEnBtn, randomModeCheckbox, unlearnedCheckbox, notClearedCheckbox, drillModeCheckbox;
let prevBtn, nextBtn, checkBtn;
let resultMessage, answerPanel, answerJa, answerEn, scorePill;
let categoryFilterSelect, questionCountSelect, historyListEl;

// ---------------------------
// 認証まわり
// ---------------------------
function updateAuthUI() {
  const authLoggedOut = document.getElementById('auth-when-logged-out');
  const authLoggedIn = document.getElementById('auth-when-logged-in');
  const authUserLabel = document.getElementById('auth-user-label');

  if (!authLoggedOut || !authLoggedIn || !authUserLabel) return;

  if (window.sessionUser) {
    authLoggedOut.style.display = 'none';
    authLoggedIn.style.display = 'flex';
    authUserLabel.textContent = `ログイン中: ${window.sessionUser.email || ''}`;
  } else {
    authLoggedOut.style.display = 'flex';
    authLoggedIn.style.display = 'none';
    authUserLabel.textContent = '';
  }
}

async function signIn() {
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert('メールアドレスとパスワードを入力してください。');
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('signIn error', error);
    alert('ログインに失敗しました: ' + error.message);
    return;
  }

  window.sessionUser = data.user;
  updateAuthUI();
  loadMyHistory();
  loadLearnedHistory(); // ログイン時に学習済みデータを取得
  alert('ログインしました。');
}

async function signOut() {
  await supabaseClient.auth.signOut();
  window.sessionUser = null;
  updateAuthUI();
  loadMyHistory();
  learnedQuestionIds.clear(); // ログアウト時はクリア
  alert('ログアウトしました。');
}

// ---------------------------
// 勘定科目プルダウン関連
// ---------------------------

// 問題レコードから「この問題で使える勘定科目リスト」を生成
function buildAccountListFromQuestion(q) {
  let list = [];
  const isEn = currentLang === 'en';

  // 問題固有のオプションがあればそれを使う
  const options = isEn ? q.account_optionsEn : q.account_options;

  if (options) {
    if (Array.isArray(options)) {
      list = options;
    } else if (typeof options === 'string') {
      list = options.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  // account_options が空ならデフォルトマスターを使用
  if (!list || list.length === 0) {
    list = isEn ? accountMasterEn.slice(1) : accountMaster.slice(1);
  }

  // 重複除去
  const unique = Array.from(new Set(list));

  // 先頭に「空欄」を追加
  unique.unshift("");

  return unique;
}

// 渡された勘定科目リストで、全てのセレクトボックスを再構築
function setAccountSelectOptions(accountList) {
  const selects = document.querySelectorAll(".account-select");
  selects.forEach((sel) => {
    const currentValue = sel.value; // 一応退避

    sel.innerHTML = "";
    accountList.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name === "" ? "（空欄）" : name;
      sel.appendChild(opt);
    });

    // もし元の値がまだリストに存在するなら、復元してもよい
    if (accountList.includes(currentValue)) {
      sel.value = currentValue;
    }
  });
}

// 初期化用（最初に何も問題がない状態で呼ぶ）
function initAccountSelects() {
  setAccountSelectOptions(accountMaster);
}

// 入力をクリア
function clearEntryInputs() {
  for (let i = 1; i <= ENTRY_ROW_COUNT; i++) {
    document.getElementById("debit-account-" + i).value = "";
    document.getElementById("debit-amount-" + i).value = "";
    document.getElementById("credit-account-" + i).value = "";
    document.getElementById("credit-amount-" + i).value = "";
  }
  resultMessage.textContent = "";
  resultMessage.className = "result-message";
  answerPanel.style.display = "none";
}

// スコア表示更新
function updateScore() {
  if (!scorePill) return;
  scorePill.textContent = `正解 ${totalCorrect} / ${totalAnswered}`;
}

// 出題カテゴリ・問題数の選択肢をセット
function setupCategoryFilterOptions(all) {
  if (!categoryFilterSelect || !questionCountSelect) return;
  
  // 現在の選択値を保存（再描画時の復元用）
  const currentCat = categoryFilterSelect.value;
  const currentCount = questionCountSelect.value;
  const t = i18n[currentLang];

// まずカテゴリ一覧を重複なしで収集
const catsSet = new Set();
  all.forEach(q => {
    if (q.categoryJa) catsSet.add(q.categoryJa);
  });

// ★ 自分で決めた順番でソート
const cats = [...catsSet].sort((a, b) => {
  const ia = CATEGORY_ORDER.indexOf(a);
  const ib = CATEGORY_ORDER.indexOf(b);

// CATEGORY_ORDER に載ってないものは後ろに回す
if (ia === -1 && ib === -1) {
  // 両方とも未定義なら一応五十音で
  return a.localeCompare(b, "ja");
}
if (ia === -1) return 1;
if (ib === -1) return -1;
return ia - ib;
});

// セレクト生成
categoryFilterSelect.innerHTML = '';
const optAll = document.createElement('option');
optAll.value = '';
optAll.textContent = t['filter-cat-all'] || 'すべてのカテゴリ';
categoryFilterSelect.appendChild(optAll);

cats.forEach(cJa => {
const opt = document.createElement('option');
opt.value = cJa; // 内部的には日本語カテゴリ名をIDとして使う

// 表示ラベル
let label = cJa;
if (currentLang === 'en') {
  // そのカテゴリを持つ最初の問題を探して英語名を取得
  const q = all.find(x => x.categoryJa === cJa);
  if (q && q.categoryEn) label = q.categoryEn;
}
opt.textContent = label;
categoryFilterSelect.appendChild(opt);
});

// 選択復元
if (currentCat) categoryFilterSelect.value = currentCat;

// 問題数
  questionCountSelect.innerHTML = '';
  [5, 10, 20, 50].forEach(n => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = t['filter-count-max']
      ? t['filter-count-max'](n)
      : `最大 ${n}問`;
    questionCountSelect.appendChild(opt);
  });
  const optAllQ = document.createElement('option');
  optAllQ.value = 'all';
  optAllQ.textContent = t['filter-count-all'] || '全件';
  questionCountSelect.appendChild(optAllQ);

  // デフォルト
  if (currentCount) {
    questionCountSelect.value = currentCount;
  } else {
    questionCountSelect.value = '10';
  }
}

// 配列をシャッフル
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 出題セット作成
function createQuestionSetFromUI() {
  if (!allQuestions || allQuestions.length === 0) {
    questions = [];
    return;
  }
  const cat = categoryFilterSelect ? categoryFilterSelect.value : '';
  const countValue = questionCountSelect ? questionCountSelect.value : '10';
  const unlearnedOnly = unlearnedCheckbox ? unlearnedCheckbox.checked : false;
  const notClearedOnly = notClearedCheckbox ? notClearedCheckbox.checked : false;
  const drillMode = drillModeCheckbox ? drillModeCheckbox.checked : false;

  let pool = allQuestions;
  if (cat) {
    pool = pool.filter(q => q.categoryJa === cat);
  }
  
  // 未学習フィルタ
  if (unlearnedOnly) {
    if (!window.sessionUser) {
      alert(currentLang === 'en' ? 'Please log in to use "Unlearned only".' : '「未学習のみ」機能を使うにはログインしてください。');
      // チェックを外すなどの処理はせず、そのまま全件対象にするか、空にするか。ここではアラート出してフィルタしない挙動にする
    } else {
      pool = pool.filter(q => !learnedQuestionIds.has(q.id));
    }
  }

  // 未修得フィルタ（クリア済みを除外）
  if (notClearedOnly) {
    if (!window.sessionUser) {
      alert(currentLang === 'en' ? 'Please log in to use "Not cleared only".' : '「未修得のみ」機能を使うにはログインしてください。');
    } else {
      // クリア済みIDに含まれていないものを残す（未学習も含まれる）
      pool = pool.filter(q => !clearedQuestionIds.has(q.id));
    }
  }

  if (pool.length === 0) {
    questions = [];
    return;
  }

  shuffleArray(pool);
  let maxCount = pool.length;
  if (countValue !== 'all') {
    const n = Number(countValue);
    if (!Number.isNaN(n)) {
      maxCount = Math.min(n, pool.length);
    }
  }
  questions = pool.slice(0, maxCount);
  currentIndex = 0;
  historyStack = [];
  
  // 特訓モード初期化
  isDrillMode = drillMode;
  drillStreaks = {};
  drillCompletedIds = new Set();
  if (isDrillMode) {
    questions.forEach(q => drillStreaks[q.id] = 0);
    randomMode = true; // 特訓モードは強制ランダム推奨だが、一旦フラグだけ立てておく
  }
}

// 新しいセッション開始（UI操作から）
function startNewSessionFromUI() {
  createQuestionSetFromUI();
  if (!questions || questions.length === 0) {
    questionLabel.textContent = '問題がありません。';
    questionTextJa.textContent = '';
    questionTextEn.textContent = '';
    categoryLabel.textContent = '';
    idLabel.textContent = '';
    randomLabel.textContent = '';
    initAccountSelects();
    clearEntryInputs();
    return;
  }
  totalAnswered = 0;
  totalCorrect = 0;
  updateScore();
  renderQuestion();
}

//言語適用関数 applyLanguage を作る
function applyLanguage() {
  const t = i18n[currentLang];

  // data-i18n 付き要素の共通処理
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const value = t[key];
    if (!value) return;

    // 改行を <br> にしたい要素もあるので少し分岐
    if (el.id === 'hint-text' || el.id === 'progress-help') {
      el.innerHTML = value.replace(/\n/g, '<br>');
    } else {
      el.textContent = value;
    }
  });

  // スコア表示
  if (scorePill) {
    scorePill.textContent = t.score(totalCorrect, totalAnswered);
  }
  
  // フィルタの選択肢を言語に合わせて更新
  setupCategoryFilterOptions(allQuestions);
  
  // 現在表示中の問題の勘定科目プルダウンなどを更新
  renderQuestion();

  // 履歴エリア（ログインしていないときのメッセージなど）は loadMyHistory 内で t を使う形でもOK
}

// 画面へ問題を反映 - 修正後
function renderQuestion() {
  if (!questions || questions.length === 0) {
    questionLabel.textContent = '問題がありません。';
    return;
  }
  
  const q = questions[currentIndex];
  questionLabel.textContent = `問題 ${currentIndex + 1} / ${questions.length}`;
  categoryLabel.textContent = currentLang === "ja" ? (q.categoryJa || '') : (q.categoryEn || '');
  idLabel.textContent = `ID: ${q.id || ''}`;
  
  let modeText = "";
  if (isDrillMode) {
    const streak = drillStreaks[q.id] || 0;
    modeText = `特訓: 連続正解 ${streak}/3`;
  } else if (randomMode) {
    modeText = "（ランダム出題中）";
  }
  randomLabel.textContent = modeText;

  if (currentLang === "ja") {
    questionTextEn.style.display = "none";
    questionTextJa.style.display = "block";

    const text = q.questionJa || "";

    // ルビONかつ Kuroshiro 初期化済みなら <ruby> に変換
    if (rubyEnabled && kuroshiroReady && kuroshiro) {
      // まず一時的にテキストを表示
      questionTextJa.textContent = text;
      
      // 非同期でルビ変換を適用
      kuroshiro.convert(text, {
        to: "hiragana",
        mode: "furigana"
     }).then((furiganaText) => {
      console.log("変換結果(raw):", furiganaText);
        
        // まだ同じ問題を表示しているか確認
      if (questions[currentIndex] === q) {
        const rubyHtml = furiganaTextToRubyHtml(furiganaText);
        questionTextJa.innerHTML = rubyHtml;
      }
    }).catch((e) => {
      console.error("convert error", e);
      questionTextJa.textContent = text;
    });
  } else {
    // ルビOFFなら普通にテキスト
    questionTextJa.textContent = text;
  }
} else {
  // 英語表示
    questionTextJa.style.display = "none";
    questionTextEn.style.display = "block";
    questionTextEn.textContent = q.questionEn || '';
  }

  // この問題専用の勘定科目リストをセット
  const accountList = buildAccountListFromQuestion(q);
  setAccountSelectOptions(accountList);

  // ボタン状態
  langJaBtn.classList.toggle("active", currentLang === "ja");
  langEnBtn.classList.toggle("active", currentLang === "en");
  randomModeCheckbox.checked = randomMode;

  // 入力クリア
  clearEntryInputs();
}

// 次の問題へ
function goNextQuestion() {
  if (!questions || questions.length === 0) return;
  
  // 特訓モードの場合の次問題選択ロジック
  if (isDrillMode) {
    // まだクリアしていない問題候補
    const candidates = questions.filter(q => !drillCompletedIds.has(q.id));
    if (candidates.length === 0) {
      alert(currentLang === 'en' ? "Drill Completed! All questions cleared." : "特訓完了！すべての問題を3回連続正解しました！");
      return;
    }
    // ランダムに選ぶ
    const nextQ = candidates[Math.floor(Math.random() * candidates.length)];
    currentIndex = questions.indexOf(nextQ);
    renderQuestion();
    return;
  }

  historyStack.push(currentIndex); // 戻る用に積む

  if (randomMode) {
    let next;
    if (questions.length === 1) {
      next = 0;
    } else {
      do {
        next = Math.floor(Math.random() * questions.length);
      } while (next === currentIndex);
    }
    currentIndex = next;
  } else {
    currentIndex = (currentIndex + 1) % questions.length;
  }
  renderQuestion();
}

// 前の問題へ
function goPrevQuestion() {
  if (historyStack.length === 0) {
    return;
  }
  const prevIndex = historyStack.pop();
  currentIndex = prevIndex;
  renderQuestion();
}

// 入力から仕訳を取得
function getUserEntries() {
  const debit = [];
  const credit = [];

  for (let i = 1; i <= ENTRY_ROW_COUNT; i++) {
    const dAcc = document.getElementById("debit-account-" + i).value.trim();
    const dAmtStr = document.getElementById("debit-amount-" + i).value.trim();
    const cAcc = document.getElementById("credit-account-" + i).value.trim();
    const cAmtStr = document.getElementById("credit-amount-" + i).value.trim();

    if (dAcc !== "" && dAmtStr !== "") {
      const amt = parseAmount(dAmtStr);
      if (!Number.isNaN(amt) && amt > 0) {
        debit.push({ account: dAcc, amount: amt });
      }
    }
    if (cAcc !== "" && cAmtStr !== "") {
      const amt = parseAmount(cAmtStr);
      if (!Number.isNaN(amt) && amt > 0) {
        credit.push({ account: cAcc, amount: amt });
      }
    }
  }

  return { debit, credit };
}

// 両側の合計が一致しているか
function isBalanced(entries) {
  const sum = (list) => list.reduce((acc, e) => acc + e.amount, 0);
  return sum(entries.debit) === sum(entries.credit);
}

// 片側比較
function compareSide(userList, correctList) {
  if (!Array.isArray(correctList)) return false;
  if (userList.length !== correctList.length) return false;

  const remaining = correctList.map((e) => ({ ...e })); // コピー

  for (const u of userList) {
    const index = remaining.findIndex(
      (c) => c.account === u.account && Number(c.amount) === Number(u.amount)
    );
    if (index === -1) {
      return false;
    }
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}


// 学習ログ保存（ログイン時のみ）
async function logStudyResult_TEST(q, isCorrect) {
  if (!window.sessionUser) return;

  try {
    const nowIso = new Date().toISOString();
    
    const payload = {
      user_id: window.sessionUser ? window.sessionUser.id : null,
      content_type: "quiz",
      content_id: String((q && q.id) ? q.id : ""),
      is_correct: isCorrect,
      answer_json: { 
        test: "ok",
        question_id: q && q.id ? q.id : "",
        is_correct: isCorrect,
        timestamp: nowIso
      },
      meta: {
        lang: currentLang || "ja", 
        action: "answer" 
      },
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };

    console.log("🔥 ABOUT TO INSERT STUDY_LOGS:", Object.keys(payload));
    console.log("📦 payload FINAL:", JSON.stringify(payload, null, 2));
    
    const { data, error } = await supabaseClient
      .from('study_logs')       
      .insert([payload]);
              
    if (error) {
      console.error('study_logs insert error', error);
      console.error("Error details:", error.message);
    } else {
      console.log('✅ study_logs insert success:', data);
      loadMyHistory();
    }
  } catch (e) {
    console.error('logStudyResult exception', e);
    console.error("Stack trace:", e.stack);
  }
}


// ← この下に追加
// Supabase の solution JSON を { debit: [...], credit: [...] } 形式にそろえる
function normalizeSolution(raw) {
  if (!raw) return { debit: [], credit: [] };

  let debits = [];
  let credits = [];

  // パターン1: {debits: [...], credits: [...]}
  if (Array.isArray(raw.debits)) debits = raw.debits;
  if (Array.isArray(raw.credits)) credits = raw.credits;

  // パターン2: {debit: [...], credit: [...]}（ハードコード問題用）
  if (debits.length === 0 && Array.isArray(raw.debit)) debits = raw.debit;
  if (credits.length === 0 && Array.isArray(raw.credit)) credits = raw.credit;

  const normalizeSide = (list) =>
    (list || []).map((e) => ({
      account: (e.account || "").trim(),
      amount: parseAmount(e.amount)
    })).filter(e => e.account && !Number.isNaN(e.amount));

  return {
    debit: normalizeSide(debits),
    credit: normalizeSide(credits)
  };
}

// ===== AI解説（この問題） =====
function appendAiMessage(role, text) {
  const box = document.getElementById("ai-chat-box");
  if (!box) return;

  const wrap = document.createElement("div");
  wrap.style.margin = "6px 0";
  wrap.style.padding = "6px 8px";
  wrap.style.borderRadius = "10px";
  wrap.style.background = role === "user" ? "#ffffff" : "#eef5ff";
  wrap.style.border = "1px solid rgba(0,0,0,0.04)";

  const head = document.createElement("div");
  head.style.fontWeight = "700";
  head.style.color = role === "user" ? "#333" : "var(--primary)";
  head.style.marginBottom = "2px";
  head.textContent = role === "user" ? "あなた" : "AI";

  const body = document.createElement("div");
  body.style.whiteSpace = "pre-wrap";
  body.textContent = text;

  wrap.appendChild(head);
  wrap.appendChild(body);
  box.appendChild(wrap);

  box.scrollTop = box.scrollHeight;
}

function buildExplainPayloadForCurrentQuestion() {
  if (!questions || questions.length === 0) return null;
  const q = questions[currentIndex];

  const modelJa = q.journalJa || "";
  const modelEn = q.journalEn || "";
  const sol = q.solution || null;

  return {
    lang: currentLang,
    questionId: q.id || "",
    categoryJa: q.categoryJa || "",
    categoryEn: q.categoryEn || "",
    questionJa: q.questionJa || "",
    questionEn: q.questionEn || "",
    modelJa,
    modelEn,
    solution: sol
  };
}

async function askAiExplainCurrentQuestion() {
  const btn = document.getElementById("btn-ai-explain");
  if (btn) btn.disabled = true;

  try {
    if (!questions || questions.length === 0) {
      appendAiMessage("ai", "問題が読み込めていません。");
      return;
    }

    const q = questions[currentIndex];
    appendAiMessage("user", "この問題を解説して（ポイント・考え方・仕訳の理由を知りたい）");

    const WORKER_URL = window.APP_AI_WORKER_URL || "";
    if (!WORKER_URL) {
      appendAiMessage("ai", "AIサーバー（Worker）のURLが未設定です。config.js に APP_AI_WORKER_URL を追加してください。");
      return;
    }

    const prompt = `
あなたは簿記の先生です。留学生向けに「やさしい日本語」で説明してください。短い英語も添えてください。
次の問題を解説してください。

【問題ID】${q.id || ""}
【カテゴリ】${q.categoryJa || ""}
【問題文（日本語）】
${q.questionJa || ""}

【模範仕訳（日本語）】
${(q.journalJa || "").replace(/<br\s*\/?>/gi, "\n")}

お願い：
1) まず結論の仕訳（借方／貸方）
2) つぎにポイント（なぜその科目？）
3) 最後に短い英語でまとめ（2〜4行）
`.trim();

    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    if (!res.ok) {
      const text = await res.text();
      appendAiMessage("ai", "エラー: " + res.status + " / " + text);
      return;
    }

    const data = await res.json();
    const answer = data.answer || data.response || JSON.stringify(data);

    appendAiMessage("ai", answer);

  } catch (e) {
    console.error(e);
    appendAiMessage("ai", "通信エラーが発生しました。");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ✅ 用語をリンク化する関数
function linkifyJournalText(text, refLinks) {
  if (!text) return "";
  
  // refLinksがない場合でも、改行コードを<br>に変換して返す
  if (!refLinks || Object.keys(refLinks).length === 0) {
    return text.replace(/\n/g, "<br>");
  }

  let html = text;

  // refLinks = { "売上(現金)": "https://...026.png", ... }
  for (const [term, url] of Object.entries(refLinks)) {
    if (!term || !url) continue;

    // term を <a> に置換
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");

    html = html.replace(re,
      `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#005bac;text-decoration:underline;">${term}</a>`
    );
  }

  // 改行を <br> に戻す
  html = html.replace(/\n/g, "<br>");
  return html;
}


// 答え合わせ
async function checkAnswer() {
  if (!questions || questions.length === 0) {
    return;
  }

  const q = questions[currentIndex];
  const user = getUserEntries();
  const t = i18n[currentLang];
           
  // --- 模範解答（正誤判定に使う）
  const norm = normalizeSolution(q.solution);

  // --- 原因メッセージを積む
  let reasonMessages = [];

  // 入力なし → 不正解
  const isEmpty = (user.debit.length === 0 && user.credit.length === 0);
  if (isEmpty) {
    reasonMessages.push(t['msg-input-required']);  // 「科目と金額を入力してください」
  }

  // 貸借不一致 → 不正解
  const balanced = isBalanced(user);
  if (!balanced) {
    reasonMessages.push(t['msg-not-balanced']);    // 「借方合計と貸方合計が一致していません」
  }

  // --- 採点（入力あり＆貸借一致のときだけ比較）
  let isCorrect = false;

  if (!isEmpty && balanced) {
    const okDebit = compareSide(user.debit, norm.debit);
    const okCredit = compareSide(user.credit, norm.credit);
    isCorrect = okDebit && okCredit;
  }

  // --- スコア更新
  totalAnswered++;
  if (isCorrect) totalCorrect++;
  updateScore();

  // --- 特訓モードの更新
  let drillMsg = "";
  if (isDrillMode) {
    const qId = q.id;
    if (isCorrect) {
      drillStreaks[qId] = (drillStreaks[qId] || 0) + 1;
      if (drillStreaks[qId] >= 3) {
        drillCompletedIds.add(qId);
        drillMsg = t['msg-drill-cleared'];
      }
    } else {
      drillStreaks[qId] = 0;
      drillMsg = t['msg-drill-reset'];
    }
  }

  // --- 結果メッセージ表示
  if (isCorrect) {
    resultMessage.textContent = t['msg-correct'];
    resultMessage.className = "result-message ok";
  } else {
    // ❗不正解の場合は、原因を追加して丁寧に表示
    const reasonText = reasonMessages.length > 0
      ? "（原因: " + reasonMessages.join(" / ") + "）"
      : "";

    resultMessage.textContent = t['msg-wrong'] + " " + reasonText;
    resultMessage.className = "result-message ng";
  }
  
  // 特訓メッセージ追記
  if (drillMsg) {
    resultMessage.textContent += " " + drillMsg;
  }

  // --- ✅ どの場合でも模範解答を表示する
  const journalJaText = (q.journalJa || "").replace(/<br\s*\/?>/gi, "\n");
  const journalEnText = (q.journalEn || "").replace(/<br\s*\/?>/gi, "\n");

  answerJa.innerHTML = linkifyJournalText(journalJaText, q.ref_links);
  answerEn.innerHTML = linkifyJournalText(journalEnText, q.ref_links);

  // --- ✅ 参照リンク（テキストへのリンク）を一覧表示する
  const refLinksDiv = document.getElementById("answer-ref-links");
  if (refLinksDiv) {
    refLinksDiv.innerHTML = ""; // クリア
    if (q.ref_links && typeof q.ref_links === 'object' && Object.keys(q.ref_links).length > 0) {
      const links = [];
      for (const [term, url] of Object.entries(q.ref_links)) {
        if (term && url) {
          links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block; margin-right:12px; margin-bottom:4px; color:#005bac; text-decoration:underline; font-weight:bold;">📖 ${term}</a>`);
        }
      }
      if (links.length > 0) {
        const label = currentLang === 'en' ? 'Reference Materials:' : '参考テキストページ:';
        refLinksDiv.innerHTML = `<div style="margin-top:12px; padding-top:8px; border-top:1px dashed #ccc;">
          <div style="font-size:0.85rem; font-weight:bold; color:#555; margin-bottom:6px;">${label}</div>
          <div style="font-size:0.9rem;">${links.join("")}</div></div>`;
      }
    }
  }

  answerPanel.style.display = "block";

  // --- ✅ 学習ログも未入力・貸借不一致でも記録する
  console.log("✅ checkAnswer reached logStudyResult call");   
  await logStudyResult_TEST(q, isCorrect);
}

// 自分の履歴読み込み
async function loadMyHistory() {
  if (!historyListEl) return;

  if (!window.sessionUser) {
    historyListEl.innerHTML =
      '<div style="font-size:0.75rem;color:#666;">ログインすると直近の解答履歴が表示されます。</div>';
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('study_logs')
      .select('id, content_id, is_correct, completed_at, created_at')
      .eq('user_id', window.sessionUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('study_logs select error', error);
      historyListEl.innerHTML = '<div style="font-size:0.75rem;color:#c00;">履歴の取得に失敗しました。</div>';
      return;
    }

    if (!data || data.length === 0) {
      historyListEl.innerHTML = '<div style="font-size:0.75rem;color:#666;">まだ履歴がありません。</div>';
      return;
    }

    historyListEl.innerHTML = '';
    data.forEach(row => {
      const div = document.createElement('div');
      div.className = 'history-item';

      const left = document.createElement('span');
      left.textContent = `Q:${row.content_id}`;

      const right = document.createElement('span');
      const flag = document.createElement('span');
      flag.textContent = row.is_correct ? '◯' : '×';
      flag.className = row.is_correct ? 'correct' : 'wrong';
      const dt = document.createElement('span');
      const ts = row.created_at;
      const d = ts ? new Date(ts) : null;        
      dt.textContent = d 
        ? d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        : "";

      right.appendChild(flag);
      right.appendChild(document.createTextNode(' '));
      right.appendChild(dt);

      div.appendChild(left);
      div.appendChild(right);
      historyListEl.appendChild(div);
    });
  } catch (e) {
    console.error('loadMyHistory exception', e);
    historyListEl.innerHTML = '<div style="font-size:0.75rem;color:#c00;">履歴の取得に失敗しました。</div>';
  }
}

// 学習済み問題IDのロード（未学習フィルタ用）
async function loadLearnedHistory() {
  if (!window.sessionUser) return;
  try {
    // 過去に一度でも解いたことがある問題IDを取得（正誤問わず）
    // 件数が多いと重くなるので直近1000件程度にするか、全件取るか。
    // ここでは簡易的に直近2000件を取得してSetにする
    // ✅ 3回連続正解判定のために is_correct も取得し、件数を増やす
    const { data, error } = await supabaseClient
      .from('study_logs')
      .select('content_id, is_correct')
      .eq('user_id', window.sessionUser.id)
      .order('created_at', { ascending: false }) // 最新順
      .limit(5000);
      
    if (!error && data) {
      learnedQuestionIds = new Set(data.map(d => d.content_id));
      console.log("学習済みIDロード完了:", learnedQuestionIds.size, "件");
      
      // ✅ 直近3回連続正解（クリア済み）の判定
      const streaks = {}; // { id: current_streak_count }
      clearedQuestionIds = new Set();

      for (const row of data) {
        const qid = row.content_id;
        // 既に「失敗（途切れ）」判定済み、または「クリア」判定済みの場合はスキップ
        if (streaks[qid] === -1 || clearedQuestionIds.has(qid)) continue;

        const current = streaks[qid] || 0;
        if (row.is_correct) {
          streaks[qid] = current + 1;
          if (streaks[qid] >= 3) {
            clearedQuestionIds.add(qid);
          }
        } else {
          streaks[qid] = -1; // 直近で不正解があったので連続ストップ
        }
      }
      console.log("学習済みID:", learnedQuestionIds.size, "件 / クリア済みID:", clearedQuestionIds.size, "件");
    }
  } catch (e) {
    console.error("loadLearnedHistory error", e);
  }
}

// ---------------------------
// 初期処理
// ---------------------------
window.addEventListener('DOMContentLoaded', async () => {
  // DOM 要素の取得
  questionLabel = document.getElementById("question-label");
  categoryLabel = document.getElementById("category-label");
  idLabel = document.getElementById("id-label");
  randomLabel = document.getElementById("random-label");
  questionTextJa = document.getElementById("question-text-ja");
  questionTextEn = document.getElementById("question-text-en");
  langJaBtn = document.getElementById("lang-ja");
  langEnBtn = document.getElementById("lang-en");
  randomModeCheckbox = document.getElementById("random-mode");
  unlearnedCheckbox = document.getElementById("filter-unlearned");
  notClearedCheckbox = document.getElementById("filter-not-cleared");
  drillModeCheckbox = document.getElementById("mode-drill");
  prevBtn = document.getElementById("prev-question");
  nextBtn = document.getElementById("next-question");
  checkBtn = document.getElementById("check-answer");
  resultMessage = document.getElementById("result-message");
  answerPanel = document.getElementById("answer-panel");
  answerJa = document.getElementById("answer-ja");
  answerEn = document.getElementById("answer-en");
  scorePill = document.getElementById("score-pill");
  categoryFilterSelect = document.getElementById("category-filter");
  questionCountSelect = document.getElementById("question-count");
  historyListEl = document.getElementById("history-list");

  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnStart = document.getElementById('btn-start-session');

  if (btnLogin) btnLogin.addEventListener('click', signIn);
  if (btnLogout) btnLogout.addEventListener('click', signOut);
  if (btnStart) btnStart.addEventListener('click', startNewSessionFromUI);

  const btnAiExplain = document.getElementById("btn-ai-explain");
  const btnAiClear = document.getElementById("btn-ai-clear");
  if (btnAiExplain) btnAiExplain.addEventListener("click", askAiExplainCurrentQuestion);
  if (btnAiClear) btnAiClear.addEventListener("click", () => {
    const box = document.getElementById("ai-chat-box");
    if (box) box.innerHTML = "";
  });

  const btnLandscape = document.getElementById("btn-landscape");
  if (btnLandscape) {
    btnLandscape.addEventListener("click", tryLandscapeMode);
  }

  async function tryLandscapeMode() {
    try {
// 1) Fullscreenにする（iPhoneでは無理な場合あり）
if (document.documentElement.requestFullscreen) {
  await document.documentElement.requestFullscreen();
}

// 2) 画面向きを横にロック（Android Chromeなどで有効）
if (screen.orientation && screen.orientation.lock) {
  await screen.orientation.lock("landscape");
} else {
  alert("この端末では横向き固定ができません。画面を横にしてご利用ください。");
}
} catch (e) {
console.warn(e);
alert("横画面モードにできませんでした。端末の設定で横向きにしてください。");
}
}

  // とりあえず初期のセレクトを作っておく
  initAccountSelects();

  // ここで一度適用
  applyLanguage();

  setupAmountInputs();

  // イベント登録（言語切り替えなど）
  langJaBtn.addEventListener("click", () => {
    currentLang = "ja";
    applyLanguage();
  });
  langEnBtn.addEventListener("click", () => {
    currentLang = "en";
    applyLanguage();
  });
  randomModeCheckbox.addEventListener("change", (e) => {
    randomMode = e.target.checked;
    renderQuestion();
  });
  nextBtn.addEventListener("click", goNextQuestion);
  prevBtn.addEventListener("click", goPrevQuestion);
  checkBtn.addEventListener("click", checkAnswer);

  document.querySelector('a[href="signup.html"]').href = window.APP_BASE_URL + "/signup.html";
  document.querySelector('a[href="forgot-password.html"]').href = window.APP_BASE_URL + "/forgot-password.html";
  
// ルビON/OFFボタン
const toggleRubyBtn = document.getElementById("toggle-ruby");
if (toggleRubyBtn) {
toggleRubyBtn.textContent = rubyEnabled ? "ルビ表示：ON" : "ルビ表示：OFF";

toggleRubyBtn.addEventListener("click", async () => {
if (!rubyEnabled) {
  toggleRubyBtn.disabled = true;
  toggleRubyBtn.textContent = "ルビ初期化中…";
  
  try {
    await Promise.race([
      initKuroshiro(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 30000))
    ]);
    
    rubyEnabled = true;
    toggleRubyBtn.textContent = "ルビ表示：ON";
    renderQuestion();
  } catch (e) {
    console.error(e);
    alert("ルビ初期化に失敗: " + (e?.message || e));
    rubyEnabled = false;
    toggleRubyBtn.textContent = "ルビ表示：OFF";
  } finally {  // ← インデント修正
    toggleRubyBtn.disabled = false;
  }      
} else {
  rubyEnabled = false;
  toggleRubyBtn.textContent = "ルビ表示：OFF";
  console.log("ルビ機能を無効化しました");
  renderQuestion();
}
});
}
  
  try {
    if (!supabaseClient) {
      throw new Error("Supabase client not initialized");
    }

    // 認証状態取得
    const { data: authData } = await supabaseClient.auth.getUser();
    window.sessionUser = authData.user || null;
    updateAuthUI(); 
    
    // quiz_questions 取得（account_options カラムも一緒に返ってくる）
    const { data, error } = await supabaseClient
      .from('quiz_questions')
      .select('*');
    if (error) {
      console.error('Supabase quiz_questions error:', error);
      allQuestions = hardcodedQuestions;
    }else if (data && data.length > 0) {
      console.log('取得したクイズ件数:', data.length);
      
      // ★ ここで solution をオブジェクトに直しておく
      allQuestions = data.map((row) => {
        let solution = row.solution;

// solution が文字列なら JSON としてパース
if (typeof solution === 'string') {
  try {
    solution = JSON.parse(solution);
  } catch (e) {
    console.error('solution JSON parse error for id =', row.id, solution, e);
    solution = null;  // 壊れている場合は一旦 null
  }
}

// 必要に応じて account_options を配列化（既に文字列で扱えているので必須ではない）
let account_options = row.account_options;
if (typeof account_options === 'string') {
  account_options = account_options
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// account_optionsEn も配列化
let account_optionsEn = row.account_optionsEn;
if (typeof account_optionsEn === 'string') {
  account_optionsEn = account_optionsEn.split(',').map(s => s.trim()).filter(Boolean);
}

// ref_links が文字列で来ている場合のパース処理（念のため）
let ref_links = row.ref_links;
if (typeof ref_links === 'string') {
  try {
    ref_links = JSON.parse(ref_links);
  } catch (e) {
    console.error('ref_links JSON parse error', e);
  }
}

return {
  ...row,
  solution,
  account_options,
  account_optionsEn,
  ref_links,
};
});

} else {
console.log('Supabase quiz_questions が空のためハードコード問題を使用します');
allQuestions = hardcodedQuestions;
}


    setupCategoryFilterOptions(allQuestions);
    
    // ★ URLパラメータ ?id=xxx があればその問題を表示するロジックを追加
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    let startedSpecific = false;

    if (targetId) {
      const found = allQuestions.find(q => q.id === targetId);
      if (found) {
        questions = [found];
        currentIndex = 0;
        historyStack = [];
        totalAnswered = 0;
        totalCorrect = 0;
        updateScore();
        renderQuestion();
        startedSpecific = true;
        console.log("特定の問題IDで開始:", targetId);
      }
    }

    if (!startedSpecific) {
      startNewSessionFromUI();
    }

    loadMyHistory();
    loadLearnedHistory();
  } catch (e) {
    console.error('初期処理エラー:', e);
    console.error('初期処理エラー (Fallback to hardcoded):', e);
    allQuestions = hardcodedQuestions;
    setupCategoryFilterOptions(allQuestions);
    startNewSessionFromUI();
  }
});

// 3桁カンマ整形（数値→文字列）
function formatWithComma(n) {
  if (n === null || n === undefined) return "";
  const s = String(n).replace(/[^\d]/g, ""); // 数字以外除去
  if (s === "") return "";
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 文字列→数値（カンマ除去してNumber化）
function parseAmount(str) {
  const s = String(str || "").replace(/[^\d]/g, "");
  if (s === "") return NaN;
  return Number(s);
}

// 金額inputにイベントを付ける
function setupAmountInputs() {
  const inputs = document.querySelectorAll(".amount-input");
  inputs.forEach((inp) => {
    inp.addEventListener("input", () => {
      const rawDigits = inp.value.replace(/[^\d]/g, "");
      // 先頭ゼロが気になるなら次の1行をON（例: 00012 -> 12）
      // const normalized = rawDigits.replace(/^0+(?=\d)/, "");
      inp.value = formatWithComma(rawDigits);
    });

    inp.addEventListener("blur", () => {
      // blur時に最終整形（空は空のまま）
      inp.value = formatWithComma(inp.value);
    });
  });
}