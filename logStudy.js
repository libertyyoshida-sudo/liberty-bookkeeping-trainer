async function logStudyResult_TEST(q, isCorrect) {
  console.log("✅ VERSION: logStudyResult_TEST 2026-01-01-03"); // 最初に実行確認
  
  try {
    // ① ログインユーザー取得
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr) {
      console.error("[auth.getUser] error", authErr);
      return;
    }
    
    const user = authData?.user;  // ✅ ここで定義
    console.log("👤 user:", user);
    
    if (!user) {
      console.warn("not logged in");
      return;
    }
    
    // ② 時刻
    const nowIso = new Date().toISOString();
    
    // ③ payload(必須カラム全部入り)
    const payload = {
      user_id: user.id,  // ✅ user が定義された後なので安全
      content_type: "quiz",
      content_id: String(q?.id || ""),
      is_correct: isCorrect,
      answer_json: { test: "ok" },
      meta: { lang: currentLang || "ja", action: "answer" },
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
    
    // loadMyHistory が定義されていれば実行
    if (typeof loadMyHistory === 'function') {
      loadMyHistory();
    }
  } catch (e) {
    console.error("logStudyResult exception", e);
  }
}


