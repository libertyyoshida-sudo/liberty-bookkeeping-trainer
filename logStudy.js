async function logStudyResult(q, isCorrect) {
  try {
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr) console.error("[auth.getUser] error", authErr);

    const user = authData?.user;
    if (!user) {
      console.warn("not logged in");
      return;
    }

    const nowIso = new Date().toISOString();

    // ✅ テスト用：絶対にnullにならない payload
    const payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(q.id || ""),
      is_correct: isCorrect,

      // ✅ NOT NULL 対策：固定値で必ず入れる
      answer_json: { test: "ok" },

      // ✅ NOT NULL
      meta: { lang: currentLang, action: "answer" },

      // ✅ NOT NULL
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };

    console.log("📦 payload FINAL:", JSON.stringify(payload, null, 2));
    console.log("📦 payload.answer_json:", payload.answer_json);

    const { data, error } = await supabaseClient
      .from("study_logs")
      .insert([payload])
      .select();

    console.log("🧾 insert data:", data);

    if (error) {
      console.error("study_logs insert error:", error);
      alert("履歴保存エラー: " + error.message);
      return;
    }

    console.log("✅ study_logs insert success");
    loadMyHistory();

  } catch (e) {
    console.error("logStudyResult exception:", e);
    alert("履歴保存で例外: " + (e?.message || e));
  }
}

