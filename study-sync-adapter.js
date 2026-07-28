(() => {
  const SYNC_TYPE = "study-log";

  const getClient = () => window.supabaseClient || null;
  const getUser = () => window.sessionUser || null;

  const createPayload = (question, isCorrect) => {
    const user = getUser();
    const nowIso = new Date().toISOString();
    const questionId = String(question?.id || "");

    return {
      user_id: user?.id || null,
      content_type: "quiz",
      content_id: questionId,
      is_correct: Boolean(isCorrect),
      answer_json: {
        question_id: questionId,
        is_correct: Boolean(isCorrect),
        timestamp: nowIso
      },
      meta: {
        lang: document.documentElement.lang || "ja",
        action: "answer",
        offline_id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
      },
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };
  };

  const insertStudyLog = async (payload) => {
    const client = getClient();
    if (!client) throw new Error("Supabase client is not ready");
    if (!payload?.user_id) throw new Error("Study log user is missing");

    const { error } = await client
      .from("study_logs")
      .insert([payload]);

    if (error) throw error;
    return true;
  };

  const queueStudyLog = async (payload) => {
    if (!window.LibertyOfflineSync) {
      throw new Error("Offline sync module is not ready");
    }

    return window.LibertyOfflineSync.queue(SYNC_TYPE, payload, {
      dedupeKey: payload.meta?.offline_id || null
    });
  };

  const saveStudyLog = async (question, isCorrect) => {
    const user = getUser();
    if (!user) return { saved: false, reason: "not-authenticated" };

    const payload = createPayload(question, isCorrect);

    if (!navigator.onLine) {
      await queueStudyLog(payload);
      window.dispatchEvent(new CustomEvent("liberty-study-log-queued", {
        detail: { payload, reason: "offline" }
      }));
      return { saved: true, queued: true };
    }

    try {
      await insertStudyLog(payload);
      window.dispatchEvent(new CustomEvent("liberty-study-log-saved", {
        detail: { payload }
      }));

      if (typeof window.loadMyHistory === "function") {
        void window.loadMyHistory();
      }

      return { saved: true, queued: false };
    } catch (error) {
      console.warn("Study log upload failed; queued for retry:", error);
      await queueStudyLog(payload);
      window.dispatchEvent(new CustomEvent("liberty-study-log-queued", {
        detail: { payload, reason: "upload-failed", error }
      }));
      return { saved: true, queued: true, error };
    }
  };

  const installAdapter = () => {
    if (!window.LibertyOfflineSync) {
      window.setTimeout(installAdapter, 100);
      return;
    }

    window.LibertyOfflineSync.register(SYNC_TYPE, async (payload) => {
      const user = getUser();
      if (!user) throw new Error("Sign-in is required before syncing study logs");

      const normalizedPayload = {
        ...payload,
        user_id: user.id
      };

      await insertStudyLog(normalizedPayload);

      if (typeof window.loadMyHistory === "function") {
        void window.loadMyHistory();
      }
    });

    // app.js calls this global function after every graded answer.
    window.logStudyResult_TEST = saveStudyLog;
    window.LibertyStudySync = {
      save: saveStudyLog,
      sync: () => window.LibertyOfflineSync.sync(),
      pending: () => window.LibertyOfflineSync.count()
    };

    if (navigator.onLine) void window.LibertyOfflineSync.sync();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installAdapter, { once: true });
  } else {
    installAdapter();
  }
})();