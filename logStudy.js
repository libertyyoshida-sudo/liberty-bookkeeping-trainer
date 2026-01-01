async function logStudyResult_TEST(q, isCorrect) {
  try {
    const { data: authData } = await supabaseClient.auth.getUser();
    const user = authData?.user;
    if (!user) return;

    const nowIso = new Date().toISOString();

    // ✅ DBの必須カラムを全て入れる
    const payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(q.id || ""),
      is_correct: isCorrect,

      // ✅ NOT NULL
      answer_json: { test: "ok" },

      // ✅ NOT NULL
      meta: { lang: currentLang, action: "answer" },

      // ✅ NOT NULL
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };

    console.log("🔥 ABOUT TO INSERT STUDY_LOGS:", Object.keys(payload));
    console.log("📦 payload FINAL:", JSON.stringify(payload, null, 2));

    const { error } = await supabaseClient
      .from("study_logs")
      .insert([payload]);

    if (error) {
      console.error("study_logs insert error", error);
      alert("履歴保存エラー: " + error.message);
      return;
    }

    console.log("✅ insert success");
    loadMyHistory();
  } catch (e) {
    console.error(e);
  }
}


