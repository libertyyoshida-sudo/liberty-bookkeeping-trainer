const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

// Supabaseクライアント初期化
let supabaseClient = null;

// ✅ v2 は createClient を import するのが正しい
console.log("Supabase loaded:", window.supabase);
console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_ANON_KEY exists:", !!SUPABASE_ANON_KEY);

if (typeof supabase !== 'undefined' && supabase.createClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

// 問題全件をロード
async function loadAllQuestions() {
  if (!supabaseClient) {
    console.warn("Supabase client not ready. Using fallback questions.");
    allQuestions = hardcodedQuestions;
    setupCategoryFilterOptions(allQuestions);
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('quiz_questions')
      .select('*')
      .order('id', { ascending: true }); // ID順で並び替え

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      allQuestions = data;
      console.log(`✅ ${data.length} questions loaded from Supabase.`);
    } else {
      console.warn("No questions found in Supabase. Using fallback.");
      allQuestions = hardcodedQuestions;
    }
    
  } catch (error) {
    console.error("Error loading questions from Supabase:", error);
    showErrorBanner(`データベースからの問題読み込みに失敗しました。オフライン用の問題を利用します。(Error: ${error.message})`);
    allQuestions = hardcodedQuestions;
  } finally {
    // カテゴリフィルタをセットアップ（DOMの準備ができていれば）
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      setupCategoryFilterOptions(allQuestions);
    }
  }
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
    'filter-review': '復習（ミスあり）',
    'filter-weak-only': '苦手優先',
    'filter-drill': '特訓モード',
    'drill-info': '特訓中: 連続3回正解でクリア',
    'drill-cleared': '★クリア済',
    'toggle-main': '借方・貸方の科目と金額を入力してください。',
    'toggle-random': 'ランダム出題',
    'hint-text': '行ごとに「借方勘定科目・金額」「貸方勘定科目・金額」を入力します。\n不要な欄は科目を「空欄」のまま、金額も空欄にしておいてください。',
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
    'progress-help': '・「出題開始」で選択した条件の問題セットを開始します。\n・「答え合わせ」で自動判定します。\n・ランダム出題をONにすると、順番をシャッフルします。\n・日本語 / 英語はいつでも切り替え可能です。',
    'btn-login': 'ログイン',
    'btn-logout': 'ログアウト',
    'link-signup': '新規登録',
    'link-forgot-pass': 'パスワードをお忘れの方はこちら',
    'account-blank': '（空欄）',
    'nav-contents': '動画・スライドを見る',
    'nav-history': '学習履歴ページへ',
    'nav-analytics': '学習分析',
    'nav-quiz': '勘定科目クイズ',

    // メッセージ系
    'msg-input-required': '科目と金額を入力してください。',
    'msg-not-balanced': '借方合計と貸方合計が一致していません。もう一度確認してください。',
    'msg-correct': [
      '◎ 正解です！ とても良いです。',
      '◎ 素晴らしい！ その調子です。',
      '◎ 完璧です！ よく理解できています。',
      '◎ 正解！ ナイスです。'
    ],
    'msg-wrong': [
      '× 惜しいです。模範仕訳を確認してみましょう。',
      '× 残念！ もう一度見直してみましょう。',
      '× 不正解です。解説を読んで復習しましょう。',
      '× ドンマイ！ 次は正解できるはずです。'
    ],
    'msg-drill-cleared': '🎉 この問題はクリアです！(3回連続正解)',
    'msg-drill-reset': '💦 不正解のためカウントリセット',
    'score': (correct, total) => `正解 ${correct} / ${total}`,
    'filter-cat-all': 'すべてのカテゴリ',
    'filter-count-max': (n) => `最大 ${n}問`,
    'filter-count-all': '全件',
    'ai-explain-title': 'AI解説（この問題）',
    'btn-ai-explain': 'この問題を解説して',
    'btn-ai-clear': 'クリア',
    'ai-note': '※AIの解説は学習補助です。最終判断はテキスト等で確認してください。',
    'btn-font-size-0': '文字サイズ: 標準',
    'btn-font-size-1': '文字サイズ: 大',
    'btn-font-size-2': '文字サイズ: 特大',
    'btn-line-height-0': '行間: 標準',
    'btn-line-height-1': '行間: 広め',
    'btn-line-height-2': '行間: 特広',
    'btn-font-family-0': 'フォント: ゴシック',
    'btn-font-family-1': 'フォント: 明朝',
    'btn-font-family-2': 'フォント: 丸ゴシック',
    'btn-speech-start': '🔊 読み上げ',
    'btn-speech-stop': '⏹ 停止',
    'btn-weak-settings': '苦手設定',
    'weak-modal-title': '苦手カテゴリの設定',
    'weak-modal-desc': '重点的に学習したいカテゴリを選択してください。',
    'btn-save': '保存',
    'btn-cancel': 'キャンセル'
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
    'filter-review': 'Review (Mistakes)',
    'filter-weak-only': 'Weak Priority',
    'filter-drill': 'Drill Mode',
    'drill-info': 'Drill: 3 consecutive correct answers to clear',
    'drill-cleared': '★Cleared',
    'toggle-main': 'Enter the accounts and amounts for debit and credit.',
    'toggle-random': 'Random order',
    'hint-text': 'For each row, enter “debit account / amount” and “credit account / amount”.\nIf a row is not needed, leave both the account and amount blank.',
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
    'progress-help': '・Click "Start" to begin questions with the selected conditions.\n・Click "Check answer" to auto-grade your entry.\n・Turn on "Random order" to shuffle questions.\n・You can switch between Japanese / English at any time.',
    'history-title': 'Recent study history',
    'btn-login': 'Log in',
    'btn-logout': 'Log out',
    'link-signup': 'Sign up',
    'link-forgot-pass': 'Forgot password?',
    'account-blank': '(Blank)',
    'nav-contents': 'Videos & Slides',
    'nav-history': 'Study History',
    'nav-analytics': 'Analytics',
    'nav-quiz': 'Account Quiz',

    'msg-input-required': 'Please enter both account names and amounts.',
    'msg-not-balanced': 'Debit total and credit total do not match. Please check again.',
    'msg-correct': [
      '◎ Correct! Well done.',
      '◎ Great job! Keep it up.',
      '◎ Perfect! You got it.',
      '◎ Correct! Nice work.'
    ],
    'msg-wrong': [
      '× Almost. Check the model journal entry.',
      '× Incorrect. Let\'s review the answer.',
      '× Not quite. Try to understand the logic.',
      '× Don\'t worry! Check the solution.'
    ],
    'msg-drill-cleared': '🎉 Question Cleared! (3 in a row)',
    'msg-drill-reset': '💦 Count reset due to wrong answer',
    'score': (correct, total) => `Correct ${correct} / ${total}`,
    'filter-cat-all': 'All Categories',
    'filter-count-max': (n) => `Max ${n} Qs`,
    'filter-count-all': 'All',
    'ai-explain-title': 'AI Explanation (This Question)',
    'btn-ai-explain': 'Explain this question',
    'btn-ai-clear': 'Clear',
    'ai-note': '* AI explanation is a study aid. Please verify with textbooks.',
    'btn-font-size-0': 'Font: Normal',
    'btn-font-size-1': 'Font: Large',
    'btn-font-size-2': 'Font: X-Large',
    'btn-line-height-0': 'Line: Normal',
    'btn-line-height-1': 'Line: Wide',
    'btn-line-height-2': 'Line: X-Wide',
    'btn-font-family-0': 'Font: Gothic',
    'btn-font-family-1': 'Font: Serif',
    'btn-font-family-2': 'Font: Rounded',
    'btn-speech-start': '🔊 Read Aloud',
    'btn-speech-stop': '⏹ Stop',
    'btn-weak-settings': 'Weak Settings',
    'weak-modal-title': 'Weak Category Settings',
    'weak-modal-desc': 'Select categories you want to focus on.',
    'btn-save': 'Save',
    'btn-cancel': 'Cancel'
  }
};

// エラーバナー表示
function showErrorBanner(message) {
  const banner = document.getElementById('error-banner');
  if (banner) {
    banner.innerHTML = message;
    banner.style.display = 'block';
  }
}

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
let wrongQuestionIds = new Set();   // 一度でも間違えたことがあるID
let weakCategories = new Set();     // ユーザーが設定した苦手カテゴリ(日本語名)
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

// 英語/日本語の勘定科目相互変換マップを生成
const jaToEnMap = new Map();
const enToJaMap = new Map();
// accountMaster と accountMasterEn の長さが違う可能性を考慮
const commonLength = Math.min(accountMaster.length, accountMasterEn.length);
for (let i = 0; i < commonLength; i++) {
  if (accountMaster[i] && accountMasterEn[i]) {
    jaToEnMap.set(accountMaster[i], accountMasterEn[i]);
    enToJaMap.set(accountMasterEn[i], accountMaster[i]);
  }
}

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
let isInitialLoad = true; // 初回読み込みフラグ

// ルビ表示用
let rubyEnabled = false;
let kuroshiro = null;
let kuroshiroReady = false;
let kuroshiroInitPromise = null;

// 文字サイズ管理
let currentFontSizeLevel = 0; // 0:標準, 1:大, 2:特大
const fontSizes = ['0.9rem', '1.3rem', '1.6rem'];

// 行間管理
let currentLineHeightLevel = 0;
const lineHeights = ['1.6', '2.2', '2.8'];

// フォント種類管理
let currentFontFamilyLevel = 0;
const fontFamilies = [
  '', // デフォルト(ゴシック系)
  '"Times New Roman", "YuMincho", "Hiragino Mincho ProN", "Yu Mincho", "MS PMincho", serif', // 明朝系
  '"Arial Rounded MT Bold", "Hiragino Maru Gothic ProN", "Rounded Mplus 1c", sans-serif' // 丸ゴシック系
];

// 音声読み上げ管理
let isSpeaking = false;

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
let langJaBtn, langEnBtn, randomModeCheckbox, unlearnedCheckbox, notClearedCheckbox, reviewCheckbox, drillModeCheckbox, weakOnlyCheckbox, btnFontSize, btnLineHeight, btnFontFamily, btnSpeech, speechRateInput, speechRateVal;
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
  loadWeakCategories(); // 苦手カテゴリ読み込み
  alert('ログインしました。');
}

async function signOut() {
  await supabaseClient.auth.signOut();
  window.sessionUser = null;
  updateAuthUI();
  loadMyHistory();
  learnedQuestionIds.clear(); // ログアウト時はクリア
  loadWeakCategories(); // ゲスト用に切り替え
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
  const t = i18n[currentLang];
  const selects = document.querySelectorAll(".account-select");
  selects.forEach((sel) => {
    const currentValue = sel.value; // 一応退避

    sel.innerHTML = "";
    accountList.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name === "" ? t['account-blank'] : name;
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
  const reviewOnly = reviewCheckbox ? reviewCheckbox.checked : false;
  const weakOnly = weakOnlyCheckbox ? weakOnlyCheckbox.checked : false;
  const drillMode = drillModeCheckbox ? drillModeCheckbox.checked : false;

  let pool = allQuestions;
  
  // 初回読み込み時はフィルタを適用しない
  if (!isInitialLoad) {
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

    // 復習モード（過去に間違えたことがある問題のみ）
    if (reviewOnly) {
      if (!window.sessionUser) {
        alert(currentLang === 'en' ? 'Please log in to use "Review mode".' : '「復習モード」機能を使うにはログインしてください。');
      } else {
        pool = pool.filter(q => wrongQuestionIds.has(q.id));
      }
    }

    // 苦手カテゴリ優先
    if (weakOnly) {
      if (weakCategories.size === 0) {
        alert(currentLang === 'en' ? 'No weak categories set. Please configure them in "Weak Settings".' : '苦手カテゴリが設定されていません。「苦手設定」ボタンから設定してください。');
      } else {
        pool = pool.filter(q => weakCategories.has(q.categoryJa));
      }
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
  isInitialLoad = false; // 初回読み込みフラグを解除
}

// 文字サイズ変更
function toggleFontSize() {
  currentFontSizeLevel = (currentFontSizeLevel + 1) % fontSizes.length;
  applyFontSize();
}

function applyFontSize() {
  const size = fontSizes[currentFontSizeLevel];
  if (questionTextJa) questionTextJa.style.fontSize = size;
  if (questionTextEn) questionTextEn.style.fontSize = size;
  
  // ボタンラベル更新
  if (btnFontSize) {
    const t = i18n[currentLang];
    btnFontSize.textContent = t[`btn-font-size-${currentFontSizeLevel}`];
  }
}

// 行間変更
function toggleLineHeight() {
  currentLineHeightLevel = (currentLineHeightLevel + 1) % lineHeights.length;
  applyLineHeight();
}

function applyLineHeight() {
  const lh = lineHeights[currentLineHeightLevel];
  if (questionTextJa) questionTextJa.style.lineHeight = lh;
  if (questionTextEn) questionTextEn.style.lineHeight = lh;
  
  if (btnLineHeight) {
    const t = i18n[currentLang];
    btnLineHeight.textContent = t[`btn-line-height-${currentLineHeightLevel}`];
  }
}

// フォント変更
function toggleFontFamily() {
  currentFontFamilyLevel = (currentFontFamilyLevel + 1) % fontFamilies.length;
  applyFontFamily();
}

function applyFontFamily() {
  const ff = fontFamilies[currentFontFamilyLevel];
  if (questionTextJa) questionTextJa.style.fontFamily = ff;
  if (questionTextEn) questionTextEn.style.fontFamily = ff;
  
  if (btnFontFamily) {
    const t = i18n[currentLang];
    btnFontFamily.textContent = t[`btn-font-family-${currentFontFamilyLevel}`];
  }
}

// 音声読み上げ機能
function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  updateSpeechButton();
}

function toggleSpeech() {
  if (isSpeaking) {
    stopSpeech();
  } else {
    playSpeech();
  }
}

function playSpeech() {
  if (!questions || questions.length === 0) return;
  const q = questions[currentIndex];
  // 現在の言語に合わせてテキストを選択
  const text = currentLang === 'ja' ? q.questionJa : q.questionEn;
  
  if (!text) return;

  const uttr = new SpeechSynthesisUtterance(text);
  uttr.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
  uttr.rate = speechRateInput ? parseFloat(speechRateInput.value) : 1.0; // 速度

  uttr.onend = () => {
    isSpeaking = false;
    updateSpeechButton();
  };

  uttr.onerror = (e) => {
    console.error('Speech error', e);
    isSpeaking = false;
    updateSpeechButton();
  };

  window.speechSynthesis.cancel(); // 前のを止める
  window.speechSynthesis.speak(uttr);
  isSpeaking = true;
  updateSpeechButton();
}

function updateSpeechButton() {
  if (!btnSpeech) return;
  const t = i18n[currentLang];
  btnSpeech.textContent = isSpeaking ? t['btn-speech-stop'] : t['btn-speech-start'];
  // 読み上げ中は色を変えるなどのスタイル変更も可能
  if (isSpeaking) {
    btnSpeech.style.background = '#ffc107'; // 黄色っぽく
    btnSpeech.style.color = '#000';
  } else {
    btnSpeech.style.background = '';
    btnSpeech.style.color = '';
  }
}

// --- 苦手カテゴリ設定関連 ---
function loadWeakCategories() {
  const key = window.sessionUser ? `liberty_weak_${window.sessionUser.id}` : 'liberty_weak_guest';
  try {
    const json = localStorage.getItem(key);
    if (json) {
      weakCategories = new Set(JSON.parse(json));
    } else {
      weakCategories = new Set();
    }
  } catch (e) {
    console.error(e);
    weakCategories = new Set();
  }
}

function saveWeakCategories() {
  const key = window.sessionUser ? `liberty_weak_${window.sessionUser.id}` : 'liberty_weak_guest';
  const arr = Array.from(weakCategories);
  localStorage.setItem(key, JSON.stringify(arr));
}

function openWeakSettingsModal() {
  const modal = document.getElementById('weak-modal');
  const list = document.getElementById('weak-cat-list');
  if (!modal || !list) return;

  // カテゴリ一覧生成
  const catsSet = new Set();
  allQuestions.forEach(q => { if (q.categoryJa) catsSet.add(q.categoryJa); });
  
  // ソート
  const cats = [...catsSet].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, "ja");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  list.innerHTML = '';
  cats.forEach(catJa => {
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '6px';
    label.style.cursor = 'pointer';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.value = catJa;
    if (weakCategories.has(catJa)) chk.checked = true;

    // 表示名（英語対応）
    const q = allQuestions.find(x => x.categoryJa === catJa);
    const dispName = (currentLang === 'en' && q && q.categoryEn) ? q.categoryEn : catJa;

    label.appendChild(chk);
    label.appendChild(document.createTextNode(dispName));
    div.appendChild(label);
    list.appendChild(div);
  });

  modal.style.display = 'flex';
}

function closeWeakSettingsModal() {
  document.getElementById('weak-modal').style.display = 'none';
}

function saveWeakSettingsFromModal() {
  const list = document.getElementById('weak-cat-list');
  if (!list) return;
  
  const checkboxes = list.querySelectorAll('input[type="checkbox"]');
  weakCategories.clear();
  checkboxes.forEach(chk => {
    if (chk.checked) weakCategories.add(chk.value);
  });
  
  saveWeakCategories();
  closeWeakSettingsModal();
  
  // もし「苦手優先」にチェックが入っていたら、即座に反映するか、
  // ユーザーに「出題開始」を押させるか。ここではアラート等は出さず保存のみ。
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
  loadMyHistory();
  
  // 文字サイズボタンのラベル更新
  applyFontSize();
  
  // 行間・フォントボタンのラベル更新
  applyLineHeight();
  applyFontFamily();
  
  // 読み上げボタンのラベル更新
  updateSpeechButton();
}

// 画面へ問題を反映 - 修正後
function renderQuestion() {
  if (!questions || questions.length === 0) {
    questionLabel.textContent = '問題がありません。';
    return;
  }
  
  // 問題が変わったら読み上げ停止
  stopSpeech();
  
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

// 金額入力のリアルタイムフォーマット処理
function handleAmountInput(e) {
  const input = e.target;
  const originalValue = input.value;
  const cursorPos = input.selectionStart;
  
  // 数字以外の文字をすべて除去
  const numericValue = originalValue.replace(/[^0-9]/g, "");

  if (numericValue === "") {
    input.value = "";
    return;
  }

  // カンマ区切りにフォーマット
  const formattedValue = Number(numericValue).toLocaleString('en-US');

  // 元の値のカーソル位置までにあったカンマの数
  const commasBeforeCursor = (originalValue.substring(0, cursorPos).match(/,/g) || []).length;
  
  // 値が変更された場合のみDOMを更新
  if (originalValue !== formattedValue) {
    input.value = formattedValue;

    // カーソル位置を再計算
    const newCommas = (formattedValue.substring(0, cursorPos).match(/,/g) || []).length;
    let cursorOffset = newCommas - commasBeforeCursor;

    // 削除操作などで文字列が短くなった場合のオフセット調整
    if (formattedValue.length < originalValue.length) {
        cursorOffset += (formattedValue.length - originalValue.length);
    }
    
    let newCursorPos = cursorPos + cursorOffset;

    // カーソル位置を設定
    input.setSelectionRange(newCursorPos, newCursorPos);
  }
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

// カンマ区切りの文字列を数値に変換
function parseAmount(str) {
  if (typeof str !== 'string' || !str) return NaN;
  return Number(str.replace(/,/g, ''));
}

// 数値をカンマ区切りの文字列に変換
function formatAmount(num) {
  if (typeof num !== 'number' || isNaN(num)) return '';
  return num.toLocaleString('en-US');
}

//両側の合計が一致しているか
function isBalanced(entries) {
  const sum = (list) => list.reduce((acc, e) => acc + e.amount, 0);
  return sum(entries.debit) === sum(entries.credit);
}

// 答え合わせロジック（刷新版）
function checkAnswer() {
  if (!questions || questions.length === 0) {
    console.log("No questions loaded, cannot check answer.");
    return;
  }

  const t = i18n[currentLang];
  const q = questions[currentIndex];

  // 1. ユーザー入力取得と基本バリデーション
  const userEntriesRaw = getUserEntries();

  if (userEntriesRaw.debit.length === 0 && userEntriesRaw.credit.length === 0) {
    resultMessage.textContent = t['msg-input-required'];
    resultMessage.className = "result-message warning";
    return;
  }

  if (!isBalanced(userEntriesRaw)) {
    resultMessage.textContent = t['msg-not-balanced'];
    resultMessage.className = "result-message warning";
    return;
  }
  
  if (!q || !q.solution) {
      console.error("Current question or its solution is missing.");
      resultMessage.textContent = "エラー: 現在の問題または解答データがありません。";
      resultMessage.className = "result-message wrong";
      return;
  }

  // 2. ユーザー入力と正解データを正規化（比較のため）
  let userEntries = userEntriesRaw;

  // 英語モードの場合、ユーザーの英語入力を日本語に翻訳する
  if (currentLang === 'en') {
    const toJapanese = (enName) => {
      const jaOptions = (q.account_options || '').split(',').map(s => s.trim()).filter(Boolean);
      const enOptions = (q.account_optionsEn || '').split(',').map(s => s.trim()).filter(Boolean);
      if (jaOptions.length > 0 && enOptions.length > 0) {
        const index = enOptions.indexOf(enName);
        if (index !== -1 && index < jaOptions.length) {
          return jaOptions[index];
        }
      }
      return enToJaMap.get(enName) || enName;
    };
    
    userEntries = {
      debit: userEntriesRaw.debit.map(e => ({ ...e, account: toJapanese(e.account) })),
      credit: userEntriesRaw.credit.map(e => ({ ...e, account: toJapanese(e.account) })),
    };
  }

  // 正解データを安全に取得
  const correctSolution = {
    debit: (q.solution.debit || []).map(e => ({ ...e })),
    credit: (q.solution.credit || []).map(e => ({ ...e }))
  };

  // 3. 正規化された形式で比較
  const canonicalize = (entries) => entries
      .map(e => e && e.account ? `${(e.account || '').trim()}|${e.amount}` : '')
      .filter(Boolean) //空の文字列を除外
      .sort();

  const userDebitCanon = canonicalize(userEntries.debit);
  const userCreditCanon = canonicalize(userEntries.credit);
  const correctDebitCanon = canonicalize(correctSolution.debit);
  const correctCreditCanon = canonicalize(correctSolution.credit);
  
  const isCorrect = 
       JSON.stringify(userDebitCanon) === JSON.stringify(correctDebitCanon) &&
       JSON.stringify(userCreditCanon) === JSON.stringify(correctCreditCanon);

  // 4. 結果表示
  totalAnswered++;
  if (isCorrect) {
    totalCorrect++;
    const correctMessages = t['msg-correct'];
    resultMessage.textContent = correctMessages[Math.floor(Math.random() * correctMessages.length)];
    resultMessage.className = "result-message correct";
  } else {
    const wrongMessages = t['msg-wrong'];
    resultMessage.textContent = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
    resultMessage.className = "result-message wrong";
  }
  
  // ★★★ デバッグログ ★★★
  console.log("--- Checking Answer (New Logic) ---");
  console.log("Lang:", currentLang);
  console.log("User Input (raw):", JSON.stringify(userEntriesRaw));
  if (currentLang === 'en') {
    console.log("User Input (translated to JA):", JSON.stringify(userEntries));
  }
  console.log("Correct Solution (JA):", JSON.stringify(correctSolution));
  console.log("User Debit (canonical):", JSON.stringify(userDebitCanon));
  console.log("Correct Debit (canonical):", JSON.stringify(correctDebitCanon));
  console.log("User Credit (canonical):", JSON.stringify(userCreditCanon));
  console.log("Correct Credit (canonical):", JSON.stringify(correctCreditCanon));
  console.log("Result:", isCorrect ? "Correct" : "Incorrect");
  console.log("-----------------------");

  // 解答表示
  if(answerJa) answerJa.innerHTML = q.journalJa || '';
  if(answerEn) answerEn.innerHTML = q.journalEn || '';

  // 参考リンク表示
  const refLinksContainer = document.getElementById('answer-ref-links');
  if (refLinksContainer) {
    refLinksContainer.innerHTML = '';
    if (q.ref_links && typeof q.ref_links === 'object' && Object.keys(q.ref_links).length > 0) {
      const p = document.createElement('p');
      p.style.margin = '8px 0 4px';
      p.style.fontWeight = 'bold';
      p.style.fontSize = '0.8rem';
      p.textContent = '📖 参考';
      refLinksContainer.appendChild(p);
      for (const [text, url] of Object.entries(q.ref_links)) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = text;
        link.target = '_blank';
        refLinksContainer.appendChild(link);
      }
    }
  }
  
  if(answerPanel) answerPanel.style.display = "block";
  updateScore();

  // 学習ログ保存
  if (window.sessionUser) {
    logStudyResult_TEST(q, isCorrect);
    learnedQuestionIds.add(q.id);
    if (!isCorrect) {
      wrongQuestionIds.add(q.id);
    }
  }
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

// 自分の履歴読み込み
async function loadMyHistory() {
  if (!historyListEl) return;
  const t = i18n[currentLang];

  if (!window.sessionUser) {
    historyListEl.innerHTML =
      `<div style="font-size:0.75rem;color:#666;">${t['history-not-logged-in']}</div>`;
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
      historyListEl.innerHTML = `<div style="font-size:0.75rem;color:#666;">${t['history-none']}</div>`;
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
      wrongQuestionIds = new Set();

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
          // 不正解履歴があれば記録
          wrongQuestionIds.add(qid);
          streaks[qid] = -1; // 直近で不正解があったので連続ストップ
        }
      }
      console.log("学習済みID:", learnedQuestionIds.size, "件 / クリア済みID:", clearedQuestionIds.size, "件");
    }
  } catch (e) {
    console.error("loadLearnedHistory error", e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadAllQuestions();

  // DOM 取得
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
  reviewCheckbox = document.getElementById("filter-review");
  drillModeCheckbox = document.getElementById("mode-drill");
  weakOnlyCheckbox = document.getElementById("filter-weak-only");
  
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
  historyListEl = document.getElementById('history-list');

  btnFontSize = document.getElementById('btn-font-size');
  btnLineHeight = document.getElementById('btn-line-height');
  btnFontFamily = document.getElementById('btn-font-family');
  btnSpeech = document.getElementById('btn-speech');
  speechRateInput = document.getElementById('speech-rate');
  speechRateVal = document.getElementById('speech-rate-val');
  
  // イベントリスナー
  if (langJaBtn) langJaBtn.addEventListener("click", () => {
    currentLang = "ja";
    applyLanguage();
  });
  if (langEnBtn) langEnBtn.addEventListener("click", () => {
    currentLang = "en";
    applyLanguage();
  });
  if (randomModeCheckbox) randomModeCheckbox.addEventListener("click", () => (randomMode = randomModeCheckbox.checked));

  if (prevBtn) prevBtn.addEventListener("click", goPrevQuestion);
  if (nextBtn) nextBtn.addEventListener("click", goNextQuestion);
  if (checkBtn) checkBtn.addEventListener("click", checkAnswer);

  if (document.getElementById('btn-start-session')) {
    document.getElementById('btn-start-session').addEventListener('click', startNewSessionFromUI);
  }

  // 認証
  if (document.getElementById('btn-login')) {
    document.getElementById('btn-login').addEventListener('click', signIn);
  }
  if (document.getElementById('btn-logout')) {
    document.getElementById('btn-logout').addEventListener('click', signOut);
  }

  // 表示設定
  if (btnFontSize) btnFontSize.addEventListener('click', toggleFontSize);
  if (btnLineHeight) btnLineHeight.addEventListener('click', toggleLineHeight);
  if (btnFontFamily) btnFontFamily.addEventListener('click', toggleFontFamily);
  if (btnSpeech) btnSpeech.addEventListener('click', toggleSpeech);
  if (speechRateInput) speechRateInput.addEventListener('input', () => {
    if (speechRateVal) speechRateVal.textContent = parseFloat(speechRateInput.value).toFixed(1);
    // 読み上げ中なら、一度止めてから再生し直して速度を反映
    if (isSpeaking) {
      playSpeech();
    }
  });

  // ルビ
  const toggleRubyBtn = document.getElementById('toggle-ruby');
  if (toggleRubyBtn) {
    toggleRubyBtn.addEventListener('click', async () => {
      rubyEnabled = !rubyEnabled;
      toggleRubyBtn.textContent = rubyEnabled ? 'ルビ表示：ON' : 'ルビ表示：OFF';
      toggleRubyBtn.style.background = rubyEnabled ? 'var(--primary)' : '';
      
      if (rubyEnabled && !kuroshiroReady) {
        toggleRubyBtn.disabled = true;
        toggleRubyBtn.textContent = '準備中...';
        await initKuroshiro();
        toggleRubyBtn.disabled = false;
        toggleRubyBtn.textContent = 'ルビ表示：ON';
      }
      // 現在の問題を再描画してルビを反映
      renderQuestion();
    });
  }
  
  // 苦手設定モーダル
  if(document.getElementById('btn-weak-settings')) document.getElementById('btn-weak-settings').addEventListener('click', openWeakSettingsModal);
  if(document.getElementById('btn-weak-cancel')) document.getElementById('btn-weak-cancel').addEventListener('click', closeWeakSettingsModal);
  if(document.getElementById('btn-weak-save')) document.getElementById('btn-weak-save').addEventListener('click', saveWeakSettingsFromModal);

  // 金額入力欄のフォーマット（新しい方式）
  document.querySelectorAll('.amount-input').forEach(input => {
    input.addEventListener('input', handleAmountInput);
  });


  // 初期化処理
  initAccountSelects();
  applyLanguage();

  // 認証状態の初期チェックと関連データロード
  const { data: { session } } = await supabaseClient.auth.getSession();
  window.sessionUser = session?.user || null;
  updateAuthUI();
  
  loadMyHistory();
  if (window.sessionUser) {
    loadLearnedHistory();
    loadWeakCategories();
  } else {
    loadWeakCategories(); // Guest settings
  }

  // 初期状態で問題セッションを自動開始
  startNewSessionFromUI();
});
