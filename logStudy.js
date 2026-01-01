async function logStudyResult_TEST(q, isCorrect) {
  alert("✅ logStudyResult_TEST HIT");
  
  console.log("✅ VERSION: logStudyResult_TEST 2026-01-01-02");
  
  try {
    // ① ログインユーザー取得
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr) console.error("[auth.getUser] error", authErr);
    const user = authData?.user;
    console.log("👤 user:", user);
    if (!user) {
      console.warn("not logged in");
      return;
    }
    
    // ② 時刻
    const nowIso = new Date().toISOString();
    
    // ③ payload(必須カラム全部入り)
    const payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(q?.id || ""),
      is_correct: isCorrect,
      answer_json: { test: "ok" },  // ← これが送られていない!
      meta: { lang: currentLang, action: "answer" },
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };
    
    console.log("🔥 ABOUT TO INSERT:", payload);
    
    // ④ insert(カラム指定なし!)
    const { data, error } = await supabaseClient
      .from("study_logs")
      .insert([payload]);
    
    if (error) {
      console.error("❌ study_logs insert error:", error);
      alert("履歴保存エラー: " + error.message);
      return;
    }
    
    console.log("✅ insert success:", data);
    loadMyHistory();
  } catch (e) {
    console.error("❌ logStudyResult exception", e);
  }
}


