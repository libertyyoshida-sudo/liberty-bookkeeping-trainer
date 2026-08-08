(() => {
  const PROFILE_KEY = "liberty-learning-profile";
  const ACTIVITY_KEY = "liberty-learning-activity";
  const DAILY_KEY = "liberty-daily-learning";

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  const dayKey = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const hasActivity = (activity, date) => {
    return Number(activity?.[dayKey(date)]?.answered || 0) > 0;
  };

  // A streak remains active until the end of the following day. Before the
  // learner answers today, yesterday's completed streak is still displayed.
  const calculateStreak = (activity) => {
    let cursor = new Date();
    if (!hasActivity(activity, cursor)) cursor.setDate(cursor.getDate() - 1);

    let streak = 0;
    while (hasActivity(activity, cursor)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };

  const calculateLongestStreak = (activity) => {
    const activeDays = Object.entries(activity || {})
      .filter(([, value]) => Number(value?.answered || 0) > 0)
      .map(([date]) => date)
      .sort();

    let longest = 0;
    let current = 0;
    let previous = null;

    for (const date of activeDays) {
      const value = new Date(`${date}T00:00:00`);
      if (previous) {
        const diff = Math.round((value - previous) / 86400000);
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
      previous = value;
    }

    return longest;
  };

  const getSummary = async () => {
    let snapshot = null;
    if (window.LibertyProgressStore?.getSnapshot) {
      try {
        snapshot = await window.LibertyProgressStore.getSnapshot();
      } catch (error) {
        console.warn("Learning progress failed to load shared snapshot:", error);
      }
    }

    const profile = snapshot?.profile || read(PROFILE_KEY, {});
    const activity = snapshot?.activity || read(ACTIVITY_KEY, {});
    const daily = snapshot?.daily || read(DAILY_KEY, {});
    const pending = window.LibertyOfflineSync
      ? await window.LibertyOfflineSync.count().catch(() => 0)
      : 0;
    const xp = Number(profile.xp || 0);

    return {
      xp,
      level: Math.max(1, Math.floor(xp / 100) + 1),
      levelProgress: xp % 100,
      totalAnswered: Number(profile.totalAnswered || 0),
      totalCorrect: Number(profile.totalCorrect || 0),
      accuracy: profile.totalAnswered
        ? Math.round(Number(profile.totalCorrect || 0) / Number(profile.totalAnswered) * 100)
        : 0,
      todayAnswered: daily.date === dayKey() ? Number(daily.answered || 0) : 0,
      streak: calculateStreak(activity),
      longestStreak: calculateLongestStreak(activity),
      pendingSync: pending,
      online: navigator.onLine,
      source: snapshot?.source || "local"
    };
  };

  const ensureStatus = () => {
    const hero = document.querySelector(".daily-hero");
    if (!hero || document.querySelector(".daily-sync-status")) return;

    const status = document.createElement("button");
    status.type = "button";
    status.className = "daily-sync-status";
    status.setAttribute("aria-live", "polite");
    status.addEventListener("click", () => {
      if (window.LibertyOfflineSync && navigator.onLine) {
        void window.LibertyOfflineSync.sync();
      }
    });
    hero.appendChild(status);
  };

  const render = async () => {
    ensureStatus();
    const summary = await getSummary();
    const streak = document.getElementById("daily-streak");
    if (streak) streak.textContent = `🔥 ${summary.streak}`;

    const status = document.querySelector(".daily-sync-status");
    if (status) {
      status.classList.toggle("offline", !summary.online);
      status.classList.toggle("pending", summary.pendingSync > 0);
      status.disabled = !summary.online || summary.pendingSync === 0;
      status.textContent = !summary.online
        ? `オフライン・${summary.pendingSync}件保存中`
        : summary.pendingSync > 0
          ? `${summary.pendingSync}件を同期する`
          : "同期済み";
    }

    window.dispatchEvent(new CustomEvent("liberty-learning-progress-updated", {
      detail: summary
    }));
    return summary;
  };

  const scheduleRender = () => window.setTimeout(() => void render(), 0);

  [
    "liberty-offline-queued",
    "liberty-offline-duplicate",
    "liberty-offline-item-synced",
    "liberty-offline-sync-complete",
    "liberty-network-online",
    "liberty-network-offline",
    "liberty-study-log-saved",
    "liberty-study-log-queued"
  ].forEach((name) => window.addEventListener(name, scheduleRender));

  window.addEventListener("storage", (event) => {
    if ([PROFILE_KEY, ACTIVITY_KEY, DAILY_KEY].includes(event.key)) scheduleRender();
  });
  window.addEventListener("liberty-progress-updated", scheduleRender);

  window.LibertyLearningProgress = {
    getSummary,
    calculateStreak,
    calculateLongestStreak,
    refresh: render
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.setTimeout(() => void render(), 250);
    }, { once: true });
  } else {
    window.setTimeout(() => void render(), 250);
  }
})();