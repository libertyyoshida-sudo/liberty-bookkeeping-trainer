(() => {
  const DAILY_GOAL = 5;
  const STORAGE_KEY = "liberty-daily-learning";

  const todayKey = () => new Date().toISOString().slice(0, 10);

  function loadDailyState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.date !== todayKey()) return { date: todayKey(), answered: 0, correct: 0 };
      return { date: todayKey(), answered: Number(saved.answered || 0), correct: Number(saved.correct || 0) };
    } catch {
      return { date: todayKey(), answered: 0, correct: 0 };
    }
  }

  function saveDailyState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function estimateStreak() {
    try {
      const raw = localStorage.getItem("studyHistory") || localStorage.getItem("study_logs") || "[]";
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || !items.length) return 0;
      const dates = [...new Set(items.map(item => String(item.date || item.created_at || item.timestamp || "").slice(0, 10)).filter(Boolean))].sort().reverse();
      let streak = 0;
      const cursor = new Date();
      for (const date of dates) {
        if (date === cursor.toISOString().slice(0, 10)) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }
      }
      return streak;
    } catch {
      return 0;
    }
  }

  function injectDashboard() {
    const page = document.querySelector(".page");
    const header = page?.querySelector("header");
    const layout = page?.querySelector(".layout");
    if (!page || !header || !layout || document.querySelector(".daily-dashboard")) return;

    layout.id = "practice";
    layout.classList.add("practice-anchor");

    const state = loadDailyState();
    const progress = Math.min(100, Math.round((state.answered / DAILY_GOAL) * 100));
    const streak = estimateStreak();
    const level = Math.max(1, Math.floor(state.correct / 10) + 1);
    const rank = level >= 10 ? "経営者" : level >= 7 ? "総支配人" : level >= 5 ? "支配人" : level >= 3 ? "番頭" : "見習い";

    const dashboard = document.createElement("section");
    dashboard.className = "daily-dashboard";
    dashboard.innerHTML = `
      <div class="daily-hero">
        <div class="daily-kicker">DAILY BOOKKEEPING</div>
        <h2 class="daily-title">今日も1問から始めよう</h2>
        <p class="daily-subtitle">短い積み重ねが、現場で使える会計力になります。</p>
        <div class="daily-stats">
          <div class="daily-stat"><strong>🔥 ${streak}</strong><span>連続学習日</span></div>
          <div class="daily-stat"><strong>Lv.${level}</strong><span>${rank}</span></div>
          <div class="daily-stat"><strong>${state.answered}/${DAILY_GOAL}</strong><span>今日の目標</span></div>
        </div>
      </div>
      <div class="daily-grid">
        <div class="daily-card">
          <div class="daily-progress-head">
            <div><h2>今日の学習</h2><strong>${state.answered}問完了</strong></div>
            <span>${progress}%</span>
          </div>
          <div class="daily-progress-track" aria-label="今日の学習進捗"><div class="daily-progress-bar" style="width:${progress}%"></div></div>
          <button type="button" class="daily-primary" id="daily-start">▶ 今日の学習を始める</button>
          <div class="daily-tip"><span class="daily-tip-icon">💡</span><p><strong>今日の会計豆知識</strong><br>仕訳は「何が増え、何が減ったか」を先に考えると整理しやすくなります。</p></div>
        </div>
        <div class="daily-card">
          <h2>デイリーミッション</h2>
          <div class="daily-mission ${state.answered >= 1 ? "done" : ""}"><span class="daily-check">${state.answered >= 1 ? "✓" : "1"}</span><div><strong>まず1問解く</strong><small>毎日の習慣をつくる</small></div></div>
          <div class="daily-mission ${state.correct >= 3 ? "done" : ""}"><span class="daily-check">${state.correct >= 3 ? "✓" : "3"}</span><div><strong>3問正解する</strong><small>正確さを伸ばす</small></div></div>
          <div class="daily-mission ${state.answered >= DAILY_GOAL ? "done" : ""}"><span class="daily-check">${state.answered >= DAILY_GOAL ? "✓" : "5"}</span><div><strong>目標を達成する</strong><small>今日の5問を完了</small></div></div>
        </div>
      </div>`;

    header.insertAdjacentElement("afterend", dashboard);

    const nav = document.createElement("nav");
    nav.className = "daily-bottom-nav";
    nav.setAttribute("aria-label", "メインナビゲーション");
    nav.innerHTML = `
      <button type="button" class="active" data-target="top"><b>🏠</b><span>ホーム</span></button>
      <button type="button" data-target="practice"><b>✏️</b><span>学習</span></button>
      <a href="history.html"><b>📊</b><span>履歴</span></a>
      <a href="analytics.html"><b>📈</b><span>分析</span></a>
      <a href="contents.html"><b>🎥</b><span>教材</span></a>`;
    document.body.appendChild(nav);

    document.getElementById("daily-start")?.addEventListener("click", () => {
      document.getElementById("practice")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => document.getElementById("btn-start-session")?.click(), 350);
    });

    nav.querySelector('[data-target="top"]')?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    nav.querySelector('[data-target="practice"]')?.addEventListener("click", () => document.getElementById("practice")?.scrollIntoView({ behavior: "smooth" }));

    trackAnswers(state);
  }

  function trackAnswers(state) {
    const result = document.getElementById("result-message");
    if (!result) return;
    let previous = result.textContent;
    const observer = new MutationObserver(() => {
      const current = result.textContent.trim();
      if (!current || current === previous) return;
      previous = current;
      const next = loadDailyState();
      next.answered += 1;
      if (/正解|correct/i.test(current) && !/不正解|incorrect/i.test(current)) next.correct += 1;
      saveDailyState(next);
      updateDashboard(next);
    });
    observer.observe(result, { childList: true, subtree: true, characterData: true });
  }

  function updateDashboard(state) {
    const progress = Math.min(100, Math.round((state.answered / DAILY_GOAL) * 100));
    const strong = document.querySelector(".daily-progress-head strong");
    const percent = document.querySelector(".daily-progress-head > span");
    const bar = document.querySelector(".daily-progress-bar");
    const goal = document.querySelector(".daily-stat:last-child strong");
    if (strong) strong.textContent = `${state.answered}問完了`;
    if (percent) percent.textContent = `${progress}%`;
    if (bar) bar.style.width = `${progress}%`;
    if (goal) goal.textContent = `${state.answered}/${DAILY_GOAL}`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectDashboard);
  else injectDashboard();
})();