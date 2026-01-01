async function logStudyResult_TEST(q, isCorrect) {
  alert("✅ logStudyResult_TEST HIT");
  return; // ← まず止める
  
　console.log("✅ VERSION: logStudyResult_TEST 2026-01-01-01"); // ←反映確認用
  
  try {
    // ① ログインユーザー取得
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr) console.error("[auth.getUser] error", authErr);

    const user = authData?.user;   // ✅ ここで定義
    console.log("👤 user:", user);

    if (!user) {
      console.warn("not logged in");
      return;
    }

    // ② 時刻
    const nowIso = new Date().toISOString();

    // ③ payload（必須カラム全部入り）
    const payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(q?.id || ""),
      is_correct: isCorrect,
      answer_json: { test: "ok" },
      meta: { lang: currentLang, action: "answer" },
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };

    console.log("🔥 ABOUT TO INSERT STUDY_LOGS:", Object.keys(payload));
    console.log("📦 payload FINAL:", JSON.stringify(payload, null, 2));

    // ④ insert
    const { error } = await supabaseClient
      .from("study_logs")
      .insert([payload]);

    if (error) {
      console.error("study_logs insert error:", error);
      alert("履歴保存エラー: " + error.message);
      return;
    }

    console.log("✅ insert success");
    loadMyHistory();

  } catch (e) {
    console.error("logStudyResult exception", e);
  }
}



