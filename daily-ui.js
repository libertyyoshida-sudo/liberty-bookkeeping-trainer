(() => {
  const DAILY_GOAL = 5;
  const STORAGE_KEY = "liberty-daily-learning";
  const PROFILE_KEY = "liberty-learning-profile";
  const THEME_KEY = "liberty-daily-theme";
  const ACTIVITY_KEY = "liberty-learning-activity";

  const dayKey = (date = new Date()) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  };

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function loadDaily() {
    const s = read(STORAGE_KEY, {});
    return s.date === dayKey()
      ? { date: s.date, answered: Number(s.answered || 0), correct: Number(s.correct || 0) }
      : { date: dayKey(), answered: 0, correct: 0 };
  }

  function loadProfile() {
    const s = read(PROFILE_KEY, {});
    return {
      xp: Number(s.xp || 0),
      totalAnswered: Number(s.totalAnswered || 0),
      totalCorrect: Number(s.totalCorrect || 0),
      unlocked: Array.isArray(s.unlocked) ? s.unlocked : []
    };
  }

  function loadActivity() {
    const a = read(ACTIVITY_KEY, {});
    return a && typeof a === "object" && !Array.isArray(a) ? a : {};
  }

  const level = (xp) => Math.max(1, Math.floor(xp / 100) + 1);
  const rank = (lv) => (lv >= 10 ? "経営者" : lv >= 7 ? "総支配人" : lv >= 5 ? "支配人" : lv >= 3 ? "番頭" : "見習い");

  function streakFrom(activity) {
    let n = 0;
    const c = new Date();
    while ((activity[dayKey(c)]?.answered || 0) > 0) {
      n += 1;
      c.setDate(c.getDate() - 1);
    }
    return n;
  }

  function weakCategories() {
    for (const k of ["weakCategories", "weak_categories", "bookkeepingWeakCategories"]) {
      const v = read(k, null);
      if (Array.isArray(v) && v.length) return v.map(String);
    }
    return [];
  }

  function advice(p, d) {
    const acc = p.totalAnswered ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : null;
    const w = weakCategories();
    if (d.answered >= DAILY_GOAL) {
      return { icon: "🎉", title: "今日の目標を達成しました", text: "余力があれば、間違えた問題を3問だけ復習しましょう。", action: "ミスを復習", mode: "review" };
    }
    if (w.length) {
      return { icon: "🤖", title: `今日は「${w[0]}」を重点復習`, text: "登録された苦手分野を優先して、短時間で効率よく学習します。", action: "おすすめ学習を開始", mode: "weak" };
    }
    if (acc !== null && acc < 70) {
      return { icon: "🧭", title: "基礎をゆっくり固めましょう", text: `累計正答率は${acc}%です。まず5問に絞り、解説を確認しながら進めましょう。`, action: "5問トレーニング", mode: "basic" };
    }
    if (p.totalAnswered >= 10) {
      return { icon: "🚀", title: "復習で定着させましょう", text: `累計${p.totalAnswered}問を学習しました。過去のミスを優先する段階です。`, action: "ミスを復習", mode: "review" };
    }
    return { icon: "🌱", title: "まずは今日の5問から", text: "速さよりも、借方と貸方で何が増減したかを確認しましょう。", action: "今日の学習を開始", mode: "basic" };
  }

  function badges(p, d, s) {
    return [
      { id: "first", icon: "🌱", label: "初めの一歩", ok: p.totalAnswered >= 1 },
      { id: "three", icon: "🎯", label: "3問正解", ok: p.totalCorrect >= 3 },
      { id: "daily", icon: "🏁", label: "目標達成", ok: d.answered >= DAILY_GOAL },
      { id: "ten", icon: "📘", label: "10問学習", ok: p.totalAnswered >= 10 },
      { id: "perfect", icon: "💎", label: "正答率80%", ok: p.totalAnswered >= 5 && p.totalCorrect / p.totalAnswered >= 0.8 },
      { id: "streak7", icon: "🔥", label: "7日連続", ok: s >= 7 }
    ];
  }

  function calendarMonthData(activity, anchorDate = new Date()) {
    const weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const firstDayIndex = (first.getDay() + 6) % 7;
    const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    const days = [];
    let monthAnswered = 0;
    let monthCorrect = 0;
    let activeDays = 0;

    for (let index = 0; index < totalCells; index += 1) {
      const date = new Date(year, month, index - firstDayIndex + 1);
      const key = dayKey(date);
      const v = activity[key] || {};
      const answered = Number(v.answered || 0);
      const correct = Number(v.correct || 0);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = key === dayKey(new Date());
      const level = answered >= 10 ? 4 : answered >= 5 ? 3 : answered >= 2 ? 2 : answered ? 1 : 0;

      if (isCurrentMonth && answered > 0) {
        activeDays += 1;
      }
      if (isCurrentMonth) {
        monthAnswered += answered;
        monthCorrect += correct;
      }

      days.push({
        key,
        label: String(date.getDate()),
        fullLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        answered,
        correct,
        isCurrentMonth,
        isToday,
        level,
        weekday: weekdayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]
      });
    }

    return {
      monthLabel: `${year}年${month + 1}月`,
      weekdayLabels,
      days,
      monthAnswered,
      monthCorrect,
      activeDays
    };
  }

  function weekly(activity) {
    let answered = 0;
    let correct = 0;
    let active = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const v = activity[dayKey(d)] || {};
      answered += Number(v.answered || 0);
      correct += Number(v.correct || 0);
      if ((Number(v.answered) || 0) > 0) active += 1;
    }
    return { answered, correct, active, accuracy: answered ? Math.round((correct / answered) * 100) : 0 };
  }

  function calendarHtml(activity) {
    const calendar = calendarMonthData(activity);
    const monthHint = calendar.activeDays > 0
      ? `${calendar.activeDays}日学習・${calendar.monthAnswered}問`
      : "まだ学習がありません";

    return `
      <div class="daily-calendar-head">
        <div>
          <div class="daily-calendar-title">学習カレンダー</div>
          <div class="daily-calendar-subtitle">${calendar.monthLabel} · ${monthHint}</div>
        </div>
        <div class="daily-calendar-summary">
          <span>${calendar.monthAnswered}問</span>
          <small>${calendar.monthCorrect}正解</small>
        </div>
      </div>
      <div class="daily-calendar-grid">
        ${calendar.weekdayLabels.map((label) => `<div class="daily-calendar-weekday">${label}</div>`).join("")}
        ${calendar.days.map((d) => {
          const classes = [
            "daily-calendar-day",
            `level-${d.level}`,
            d.isCurrentMonth ? "is-current-month" : "is-muted",
            d.isToday ? "is-today" : ""
          ].filter(Boolean).join(" ");
          const dot = d.answered > 0 ? `<span class="daily-calendar-dot"></span>` : "";
          return `<div class="${classes}" title="${d.key}: ${d.answered}問"><span class="daily-calendar-day-number">${d.label}</span>${dot}</div>`;
        }).join("")}
      </div>
      <div class="daily-calendar-legend">
        <span>少ない</span>
        <i class="level-0"></i>
        <i class="level-1"></i>
        <i class="level-2"></i>
        <i class="level-3"></i>
        <i class="level-4"></i>
        <span>多い</span>
      </div>
    `;
  }

  function applyMode(mode) {
    const count = document.getElementById("question-count") || document.getElementById("question-count-select");
    if (count) {
      const o = [...count.options].find((x) => String(x.value) === "5" || /5/.test(x.textContent));
      if (o) count.value = o.value;
    }
    const weak = document.getElementById("weak-only") || document.getElementById("weak-only-checkbox");
    const review = document.getElementById("review-only") || document.getElementById("review-checkbox");
    if (weak && "checked" in weak) weak.checked = mode === "weak";
    if (review && "checked" in review) review.checked = mode === "review";
    document.getElementById("practice")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.getElementById("btn-start-session")?.click(), 350);
  }

  function applyTheme() {
    const s = localStorage.getItem(THEME_KEY);
    const dark = s === "dark" || (!s && matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("daily-dark", dark);
  }

  function toggleTheme() {
    const dark = !document.body.classList.contains("daily-dark");
    document.body.classList.toggle("daily-dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    const b = document.querySelector(".daily-theme-toggle");
    if (b) b.textContent = dark ? "☀️" : "🌙";
  }

  function toast(text) {
    let t = document.querySelector(".daily-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "daily-toast";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  async function loadSnapshot() {
    if (window.LibertyProgressStore?.getSnapshot) {
      try {
        return await window.LibertyProgressStore.getSnapshot();
      } catch (error) {
        console.warn("Daily UI failed to load shared progress:", error);
      }
    }
    return {
      daily: loadDaily(),
      profile: loadProfile(),
      activity: loadActivity(),
      source: "local"
    };
  }

  function updateFromSnapshot(snapshot) {
    const d = snapshot?.daily || loadDaily();
    const p = snapshot?.profile || loadProfile();
    const a = snapshot?.activity || loadActivity();
    const progress = Math.min(100, Math.round((d.answered / DAILY_GOAL) * 100));
    const lv = level(p.xp);
    const r = rank(lv);
    const s = streakFrom(a);
    const week = weekly(a);
    const coach = advice(p, d);
    const bs = badges(p, d, s);

    const set = (id, value) => {
      const e = document.getElementById(id);
      if (e) e.textContent = value;
    };

    set("daily-goal", `${d.answered}/${DAILY_GOAL}`);
    set("daily-level", `Lv.${lv}`);
    set("daily-rank", r);
    set("daily-level-detail", `Lv.${lv} ${r}`);
    set("daily-xp-label", `${p.xp % 100}/100 EXP`);
    set("daily-streak", `🔥 ${s}`);
    set("week-answered", week.answered);
    set("week-accuracy", `${week.accuracy}%`);
    set("week-active", `${week.active}/7`);

    const h = document.querySelector(".daily-progress-head strong");
    const pct = document.querySelector(".daily-progress-head>span");
    const bar = document.querySelector(".daily-progress-bar");
    const xp = document.querySelector(".daily-xp-bar");
    if (h) h.textContent = `${d.answered}問完了`;
    if (pct) pct.textContent = `${progress}%`;
    if (bar) bar.style.width = `${progress}%`;
    if (xp) xp.style.width = `${p.xp % 100}%`;

    const cal = document.getElementById("daily-calendar");
    if (cal) cal.innerHTML = calendarHtml(a);

    bs.forEach((b) => {
      document.querySelector(`[data-badge="${b.id}"]`)?.classList.toggle("unlocked", b.ok);
    });

    const states = [d.answered >= 1, d.correct >= 3, d.answered >= DAILY_GOAL];
    document.querySelectorAll(".daily-mission").forEach((m, i) => {
      m.classList.toggle("done", states[i]);
      m.querySelector(".daily-check").textContent = states[i] ? "✓" : [1, 3, 5][i];
    });

    const card = document.getElementById("daily-coach");
    if (card) {
      card.querySelector(".daily-coach-avatar").textContent = coach.icon;
      card.querySelector("strong").textContent = coach.title;
      card.querySelector("p").textContent = coach.text;
      const button = card.querySelector("button");
      button.textContent = coach.action;
      button.dataset.mode = coach.mode;
    }
  }

  function currentPageMeta() {
    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const onHome = page === "" || page === "index.html";
    return { page, onHome };
  }

  function navActiveKey() {
    const { page, onHome } = currentPageMeta();
    if (onHome) return location.hash === "#practice" ? "practice" : "home";
    if (page === "history.html") return "history";
    if (page === "analytics.html") return "analytics";
    if (page === "contents.html") return "contents";
    return null;
  }

  function injectNav() {
    if (!document.querySelector(".page") || document.querySelector(".daily-bottom-nav")) return;
    applyTheme();

    const { onHome } = currentPageMeta();
    const activeKey = navActiveKey();
    const items = [
      { key: "home", icon: "🏠", label: "ホーム" },
      { key: "practice", icon: "✏️", label: "学習" },
      { key: "history", icon: "📊", label: "履歴", href: "history.html" },
      { key: "analytics", icon: "📈", label: "分析", href: "analytics.html" },
      { key: "contents", icon: "🎥", label: "教材", href: "contents.html" }
    ];

    const nav = document.createElement("nav");
    nav.className = "daily-bottom-nav";
    nav.innerHTML = items.map((item) => {
      const cls = item.key === activeKey ? ' class="active"' : "";
      if (onHome && (item.key === "home" || item.key === "practice")) {
        const target = item.key === "home" ? "top" : "practice";
        return `<button${cls} data-target="${target}"><b>${item.icon}</b><span>${item.label}</span></button>`;
      }
      const href = item.key === "home" ? "index.html" : item.key === "practice" ? "index.html#practice" : item.href;
      return `<a${cls} href="${href}"><b>${item.icon}</b><span>${item.label}</span></a>`;
    }).join("");
    document.body.appendChild(nav);

    if (onHome) {
      nav.querySelector('[data-target="top"]')?.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
      nav.querySelector('[data-target="practice"]')?.addEventListener("click", () => {
        (document.getElementById("practice") || document.querySelector(".layout"))?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  async function inject() {
    applyTheme();
    const page = document.querySelector(".page");
    const header = page?.querySelector("header");
    const layout = page?.querySelector(".layout");
    if (!page || !header || !layout || document.querySelector(".daily-dashboard")) return;

    layout.id = "practice";
    layout.classList.add("practice-anchor");

    const snapshot = await loadSnapshot();
    const d = snapshot.daily || loadDaily();
    const p = snapshot.profile || loadProfile();
    const a = snapshot.activity || loadActivity();
    const s = streakFrom(a);
    const lv = level(p.xp);
    const r = rank(lv);
    const progress = Math.min(100, Math.round((d.answered / DAILY_GOAL) * 100));
    const coach = advice(p, d);
    const week = weekly(a);
    const bs = badges(p, d, s);

    const el = document.createElement("section");
    el.className = "daily-dashboard";
    el.innerHTML = `<div class="daily-hero"><div class="daily-kicker">DAILY BOOKKEEPING</div><h2 class="daily-title">今日も1問から始めよう</h2><p class="daily-subtitle">短い積み重ねが、現場で使える会計力になります。</p><button class="daily-theme-toggle" aria-label="表示テーマを切り替える">${document.body.classList.contains("daily-dark") ? "☀️" : "🌙"}</button><div class="daily-stats"><div class="daily-stat"><strong id="daily-streak">🔥 ${s}</strong><span>連続学習日</span></div><div class="daily-stat"><strong id="daily-level">Lv.${lv}</strong><span id="daily-rank">${r}</span></div><div class="daily-stat"><strong id="daily-goal">${d.answered}/${DAILY_GOAL}</strong><span>今日の目標</span></div></div></div><div class="daily-coach" id="daily-coach"><div class="daily-coach-avatar">${coach.icon}</div><div class="daily-coach-copy"><span>AI STUDY COACH</span><strong>${coach.title}</strong><p>${coach.text}</p></div><button class="daily-coach-action" data-mode="${coach.mode}">${coach.action}</button></div><div class="daily-grid"><div class="daily-card"><div class="daily-progress-head"><div><h2>今日の学習</h2><strong>${d.answered}問完了</strong></div><span>${progress}%</span></div><div class="daily-progress-track"><div class="daily-progress-bar" style="width:${progress}%"></div></div><button class="daily-primary" id="daily-start">▶ 今日の学習を始める</button><div class="daily-tip"><span class="daily-tip-icon">💡</span><p><strong>今日の会計豆知識</strong><br>仕訳は「何が増え、何が減ったか」を先に考えると整理しやすくなります。</p></div></div><div class="daily-card"><h2>デイリーミッション</h2>${[[d.answered >= 1, "1", "まず1問解く", "毎日の習慣をつくる"], [d.correct >= 3, "3", "3問正解する", "正確さを伸ばす"], [d.answered >= DAILY_GOAL, "5", "目標を達成する", "今日の5問を完了"]].map((x) => `<div class="daily-mission ${x[0] ? "done" : ""}"><span class="daily-check">${x[0] ? "✓" : x[1]}</span><div><strong>${x[2]}</strong><small>${x[3]}</small></div></div>`).join("")}</div><div class="daily-card"><h2>レベルとEXP</h2><div class="daily-level-row"><strong id="daily-level-detail">Lv.${lv} ${r}</strong><small id="daily-xp-label">${p.xp % 100}/100 EXP</small></div><div class="daily-xp-track"><div class="daily-xp-bar" style="width:${p.xp % 100}%"></div></div><small>正解で10 EXP、不正解でも2 EXP獲得します。</small></div><div class="daily-card"><h2>バッジ</h2><div class="daily-achievements">${bs.map((b) => `<div class="daily-badge ${b.ok ? "unlocked" : ""}" data-badge="${b.id}"><b>${b.icon}</b><span>${b.label}</span></div>`).join("")}</div></div><div class="daily-card daily-calendar-card"><div class="daily-calendar" id="daily-calendar">${calendarHtml(a)}</div></div><div class="daily-card"><h2>今週のレポート</h2><div class="daily-weekly"><div><strong id="week-answered">${week.answered}</strong><span>解答数</span></div><div><strong id="week-accuracy">${week.accuracy}%</strong><span>正答率</span></div><div><strong id="week-active">${week.active}/7</strong><span>学習日</span></div></div><a class="daily-report-link" href="analytics.html">詳しい学習分析を見る →</a></div></div>`;
    header.insertAdjacentElement("afterend", el);

    document.querySelector(".daily-theme-toggle")?.addEventListener("click", toggleTheme);
    document.querySelector(".daily-coach-action")?.addEventListener("click", (event) => applyMode(event.currentTarget.dataset.mode));
    document.getElementById("daily-start")?.addEventListener("click", () => applyMode("basic"));

    track();
    window.addEventListener("liberty-progress-updated", (event) => {
      if (event.detail?.snapshot) {
        updateFromSnapshot(event.detail.snapshot);
      }
    });
  }

  function track() {
    const result = document.getElementById("result-message");
    if (!result) return;

    let previous = result.textContent;
    new MutationObserver(() => {
      const text = result.textContent.trim();
      if (!text || text === previous) return;
      previous = text;

      const correct = /◎|正解です|Correct!/i.test(text) && !/不正解|Incorrect/i.test(text);
      const wrong = /^×|不正解|Incorrect|Almost|Not quite/i.test(text);
      if (!correct && !wrong) return;

      if (window.LibertyProgressStore?.queueRefresh) {
        if (window.sessionUser && window.supabaseClient) {
          window.LibertyProgressStore.queueRefresh("answer");
          toast(correct ? "+10 EXP 正解です！" : "+2 EXP 次の問題へ進みましょう");
          return;
        }
      }

      const d = loadDaily();
      const p = loadProfile();
      const a = loadActivity();
      const before = level(p.xp);
      const old = new Set(p.unlocked);
      d.answered += 1;
      if (correct) d.correct += 1;
      p.totalAnswered += 1;
      if (correct) p.totalCorrect += 1;
      p.xp += correct ? 10 : 2;
      const k = dayKey();
      const entry = a[k] || { answered: 0, correct: 0 };
      entry.answered += 1;
      if (correct) entry.correct += 1;
      a[k] = entry;
      const s = streakFrom(a);
      const earned = badges(p, d, s).filter((b) => b.ok).map((b) => b.id);
      p.unlocked = [...new Set([...p.unlocked, ...earned])];
      write(STORAGE_KEY, d);
      write(PROFILE_KEY, p);
      write(ACTIVITY_KEY, a);
      updateFromSnapshot({ daily: d, profile: p, activity: a });
      const after = level(p.xp);
      if (after > before) {
        toast(`🎉 レベルアップ！ Lv.${after} ${rank(after)}`);
      } else {
        const id = p.unlocked.find((x) => !old.has(x));
        const b = badges(p, d, s).find((x) => x.id === id);
        toast(b ? `🏅 バッジ獲得：${b.label}` : correct ? "+10 EXP 正解です！" : "+2 EXP 次の問題へ進みましょう");
      }
    }).observe(result, { childList: true, subtree: true, characterData: true });
  }

  function bootstrap() {
    injectNav();
    void inject();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
