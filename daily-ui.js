(() => {
  const DAILY_GOAL = 5;
  const STORAGE_KEY = "liberty-daily-learning";
  const PROFILE_KEY = "liberty-learning-profile";
  const THEME_KEY = "liberty-daily-theme";

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

  function loadProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      return {
        xp: Number(saved.xp || 0),
        totalAnswered: Number(saved.totalAnswered || 0),
        totalCorrect: Number(saved.totalCorrect || 0),
        unlocked: Array.isArray(saved.unlocked) ? saved.unlocked : []
      };
    } catch {
      return { xp: 0, totalAnswered: 0, totalCorrect: 0, unlocked: [] };
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function levelFromXp(xp) {
    return Math.max(1, Math.floor(xp / 100) + 1);
  }

  function rankFromLevel(level) {
    if (level >= 10) return "経営者";
    if (level >= 7) return "総支配人";
    if (level >= 5) return "支配人";
    if (level >= 3) return "番頭";
    return "見習い";
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

  function applyTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved === "dark" || (!saved && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("daily-dark", dark);
  }

  function toggleTheme() {
    const dark = !document.body.classList.contains("daily-dark");
    document.body.classList.toggle("daily-dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    const button = document.querySelector(".daily-theme-toggle");
    if (button) button.textContent = dark ? "☀️" : "🌙";
  }

  function achievements(profile, daily, streak) {
    return [
      { id: "first", icon: "🌱", label: "初めの一歩", unlocked: profile.totalAnswered >= 1 },
      { id: "three", icon: "🎯", label: "3問正解", unlocked: profile.totalCorrect >= 3 },
      { id: "daily", icon: "🏁", label: "目標達成", unlocked: daily.answered >= DAILY_GOAL },
      { id: "ten", icon: "📘", label: "10問学習", unlocked: profile.totalAnswered >= 10 },
      { id: "perfect", icon: "💎", label: "正答率80%", unlocked: profile.totalAnswered >= 5 && profile.totalCorrect / profile.totalAnswered >= 0.8 },
      { id: "streak7", icon: "🔥", label: "7日連続", unlocked: streak >= 7 }
    ];
  }

  function showToast(message) {
    let toast = document.querySelector(".daily-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "daily-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function injectDashboard() {
    applyTheme();
    const page = document.querySelector(".page");
    const header = page?.querySelector("header");
    const layout = page?.querySelector(".layout");
    if (!page || !header || !layout || document.querySelector(".daily-dashboard")) return;

    layout.id = "practice";
    layout.classList.add("practice-anchor");

    const state = loadDailyState();
    const profile = loadProfile();
    const progress = Math.min(100, Math.round((state.answered / DAILY_GOAL) * 100));
    const streak = estimateStreak();
    const level = levelFromXp(profile.xp);
    const rank = rankFromLevel(level);
    const xpInLevel = profile.xp % 100;
    const badges = achievements(profile, state, streak);

    const dashboard = document.createElement("section");
    dashboard.className = "daily-dashboard";
    dashboard.innerHTML = `
      <div class="daily-hero">
        <div class="daily-kicker">DAILY BOOKKEEPING</div>
        <h2 class="daily-title">今日も1問から始めよう</h2>
        <p class="daily-subtitle">短い積み重ねが、現場で使える会計力になります。</p>
        <button type="button" class="daily-theme-toggle" aria-label="表示テーマを切り替える">${document.body.classList.contains("daily-dark") ? "☀️" : "🌙"}</button>
        <div class="daily-stats">
          <div class="daily-stat"><strong>🔥 ${streak}</strong><span>連続学習日</span></div>
          <div class="daily-stat"><strong id="daily-level">Lv.${level}</strong><span id="daily-rank">${rank}</span></div>
          <div class="daily-stat"><strong id="daily-goal">${state.answered}/${DAILY_GOAL}</strong><span>今日の目標</span></div>
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
        <div class="daily-card">
          <h2>レベルとEXP</h2>
          <div class="daily-level-row"><strong id="daily-level-detail">Lv.${level} ${rank}</strong><small id="daily-xp-label">${xpInLevel}/100 EXP</small></div>
          <div class="daily-xp-track"><div class="daily-xp-bar" style="width:${xpInLevel}%"></div></div>
          <small>正解で10 EXP、不正解でも2 EXP獲得します。</small>
        </div>
        <div class="daily-card">
          <h2>バッジ</h2>
          <div class="daily-achievements">${badges.map(b => `<div class="daily-badge ${b.unlocked ? "unlocked" : ""}" data-badge="${b.id}"><b>${b.icon}</b><span>${b.label}</span></div>`).join("")}</div>
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

    document.querySelector(".daily-theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("daily-start")?.addEventListener("click", () => {
      document.getElementById("practice")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => document.getElementById("btn-start-session")?.click(), 350);
    });
    nav.querySelector('[data-target="top"]')?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    nav.querySelector('[data-target="practice"]')?.addEventListener("click", () => document.getElementById("practice")?.scrollIntoView({ behavior: "smooth" }));

    trackAnswers();
  }

  function trackAnswers() {
    const result = document.getElementById("result-message");
    if (!result) return;
    let previous = result.textContent;
    const observer = new MutationObserver(() => {
      const current = result.textContent.trim();
      if (!current || current === previous) return;
      previous = current;

      const correct = /正解|correct/i.test(current) && !/不正解|incorrect/i.test(current);
      const daily = loadDailyState();
      const profile = loadProfile();
      const beforeLevel = levelFromXp(profile.xp);
      const beforeBadges = new Set(profile.unlocked);

      daily.answered += 1;
      if (correct) daily.correct += 1;
      profile.totalAnswered += 1;
      if (correct) profile.totalCorrect += 1;
      profile.xp += correct ? 10 : 2;

      const streak = estimateStreak();
      const earned = achievements(profile, daily, streak).filter(item => item.unlocked).map(item => item.id);
      profile.unlocked = [...new Set([...profile.unlocked, ...earned])];

      saveDailyState(daily);
      saveProfile(profile);
      updateDashboard(daily, profile, streak);

      const afterLevel = levelFromXp(profile.xp);
      if (afterLevel > beforeLevel) showToast(`🎉 レベルアップ！ Lv.${afterLevel} ${rankFromLevel(afterLevel)}`);
      else {
        const newBadge = profile.unlocked.find(id => !beforeBadges.has(id));
        if (newBadge) {
          const badge = achievements(profile, daily, streak).find(item => item.id === newBadge);
          if (badge) showToast(`🏅 バッジ獲得：${badge.label}`);
        } else {
          showToast(correct ? "+10 EXP 正解です！" : "+2 EXP 次の問題へ進みましょう");
        }
      }
    });
    observer.observe(result, { childList: true, subtree: true, characterData: true });
  }

  function updateDashboard(daily, profile, streak) {
    const progress = Math.min(100, Math.round((daily.answered / DAILY_GOAL) * 100));
    const level = levelFromXp(profile.xp);
    const rank = rankFromLevel(level);
    const xpInLevel = profile.xp % 100;

    const strong = document.querySelector(".daily-progress-head strong");
    const percent = document.querySelector(".daily-progress-head > span");
    const bar = document.querySelector(".daily-progress-bar");
    if (strong) strong.textContent = `${daily.answered}問完了`;
    if (percent) percent.textContent = `${progress}%`;
    if (bar) bar.style.width = `${progress}%`;
    document.getElementById("daily-goal")?.replaceChildren(document.createTextNode(`${daily.answered}/${DAILY_GOAL}`));
    document.getElementById("daily-level")?.replaceChildren(document.createTextNode(`Lv.${level}`));
    document.getElementById("daily-rank")?.replaceChildren(document.createTextNode(rank));
    document.getElementById("daily-level-detail")?.replaceChildren(document.createTextNode(`Lv.${level} ${rank}`));
    document.getElementById("daily-xp-label")?.replaceChildren(document.createTextNode(`${xpInLevel}/100 EXP`));
    const xpBar = document.querySelector(".daily-xp-bar");
    if (xpBar) xpBar.style.width = `${xpInLevel}%`;

    achievements(profile, daily, streak).forEach(item => {
      document.querySelector(`[data-badge="${item.id}"]`)?.classList.toggle("unlocked", item.unlocked);
    });

    const missions = document.querySelectorAll(".daily-mission");
    const states = [daily.answered >= 1, daily.correct >= 3, daily.answered >= DAILY_GOAL];
    missions.forEach((mission, index) => {
      mission.classList.toggle("done", states[index]);
      const check = mission.querySelector(".daily-check");
      if (check) check.textContent = states[index] ? "✓" : String([1, 3, 5][index]);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectDashboard);
  else injectDashboard();
})();