(() => {
  const DAILY_GOAL = 5;
  const STORAGE_KEYS = {
    daily: "liberty-daily-learning",
    profile: "liberty-learning-profile",
    activity: "liberty-learning-activity"
  };

  let refreshTimer = null;

  const dayKey = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const readLocal = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeLocal = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getLocalSnapshot = () => {
    const daily = readLocal(STORAGE_KEYS.daily, {});
    const profile = readLocal(STORAGE_KEYS.profile, {});
    const activity = readLocal(STORAGE_KEYS.activity, {});

    const normalizedDaily = daily.date === dayKey()
      ? { date: daily.date, answered: Number(daily.answered || 0), correct: Number(daily.correct || 0) }
      : { date: dayKey(), answered: 0, correct: 0 };

    const normalizedProfile = {
      xp: Number(profile.xp || 0),
      totalAnswered: Number(profile.totalAnswered || 0),
      totalCorrect: Number(profile.totalCorrect || 0),
      unlocked: Array.isArray(profile.unlocked) ? profile.unlocked : []
    };

    const normalizedActivity = activity && typeof activity === "object" && !Array.isArray(activity)
      ? activity
      : {};

    return {
      daily: normalizedDaily,
      profile: normalizedProfile,
      activity: normalizedActivity,
      source: "local"
    };
  };

  const buildActivityFromLogs = (rows) => {
    const activity = {};

    rows.forEach((row) => {
      const rawValue = row?.completed_at || row?.created_at || row?.started_at;
      if (!rawValue) return;
      const stamp = new Date(rawValue);
      if (Number.isNaN(stamp.getTime())) return;
      const date = dayKey(stamp);
      const entry = activity[date] || { answered: 0, correct: 0 };
      entry.answered += 1;
      if (row?.is_correct) entry.correct += 1;
      activity[date] = entry;
    });

    return activity;
  };

  const buildSnapshotFromLogs = (rows, fallback) => {
    const activity = buildActivityFromLogs(rows || []);
    const today = dayKey();
    const answered = Number(activity[today]?.answered || 0);
    const correct = Number(activity[today]?.correct || 0);
    const totalAnswered = rows.length;
    const totalCorrect = rows.filter((row) => row?.is_correct).length;
    const xp = totalCorrect * 10 + (totalAnswered - totalCorrect) * 2;
    const profile = {
      xp,
      totalAnswered,
      totalCorrect,
      unlocked: fallback?.profile?.unlocked || []
    };

    return {
      daily: { date: today, answered, correct },
      profile,
      activity,
      source: "supabase"
    };
  };

  const getClient = () => window.supabaseClient || null;
  const getUser = () => window.sessionUser || null;

  const getSnapshot = async () => {
    const fallback = getLocalSnapshot();
    const client = getClient();
    const user = getUser();

    if (!client || !user) {
      return fallback;
    }

    try {
      const { data, error } = await client
        .from("study_logs")
        .select("id, is_correct, created_at, completed_at, started_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!Array.isArray(data)) return fallback;

      return buildSnapshotFromLogs(data, fallback);
    } catch (error) {
      console.warn("Progress sync from Supabase failed:", error);
      return fallback;
    }
  };

  const persistLocalSnapshot = (snapshot) => {
    if (!snapshot) return;
    writeLocal(STORAGE_KEYS.daily, snapshot.daily || getLocalSnapshot().daily);
    writeLocal(STORAGE_KEYS.profile, snapshot.profile || getLocalSnapshot().profile);
    writeLocal(STORAGE_KEYS.activity, snapshot.activity || getLocalSnapshot().activity);
  };

  const refresh = async (source = "manual") => {
    const snapshot = await getSnapshot();
    if (snapshot.source === "local") {
      persistLocalSnapshot(snapshot);
    }

    window.dispatchEvent(new CustomEvent("liberty-progress-updated", {
      detail: { snapshot, source }
    }));

    return snapshot;
  };

  const queueRefresh = (source = "manual") => {
    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
    }
    refreshTimer = window.setTimeout(() => {
      void refresh(source);
    }, 250);
  };

  window.LibertyProgressStore = {
    getSnapshot,
    getLocalSnapshot,
    persistLocalSnapshot,
    refresh,
    queueRefresh
  };
})();
