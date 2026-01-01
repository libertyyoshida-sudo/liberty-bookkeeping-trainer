async function logStudyResult_TEST(q, isCorrect) {
  console.log("✅ VERSION: logStudyResult_TEST 2026-01-01-03");
  console.log("📝 Parameters - q:", q, "isCorrect:", isCorrect);
  
  try {
    // Supabaseクライアントの存在確認
    if (!supabaseClient) {
      console.error("❌ Supabase client not initialized");
      return;
    }
    
    console.log("🔄 Attempting to get user from auth...");
    
    // ① ログインユーザー取得
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr) {
      console.error("[auth.getUser] error", authErr);
      return;
    }
    
    console.log("👤 authData received:", authData);
    
    const user = authData?.user;  // ✅ ここで定義
    console.log("👤 user variable:", user);
    console.log("👤 user?.id:", user?.id);
    
    if (!user) {
      console.warn("⚠️ not logged in - skipping study log");
      return;
    }
    
    // ② 時刻
    const nowIso = new Date().toISOString();
    console.log("🕐 Timestamp:", nowIso);
    
    // ③ payload(必須カラム全部入り)
    const payload = {
      user_id: user.id,  // ✅ user が定義された後なので安全
      content_type: "quiz",
      content_id: String(q?.id || ""),
      is_correct: isCorrect,
      answer_json: { 
        test: "ok",
        question_id: q?.id,
        is_correct: isCorrect,
        timestamp: nowIso
      },
      meta: { 
        lang: currentLang || "ja", 
        action: "answer" 
      },
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };
    
    console.log("🔥 ABOUT TO INSERT STUDY_LOGS:", Object.keys(payload));
    console.log("📦 payload FINAL:", JSON.stringify(payload, null, 2));
    
    // ④ insert
    console.log("🚀 Inserting into study_logs table...");
    const { data, error } = await supabaseClient
      .from("study_logs")
      .insert([payload])
      .select();
    
    if (error) {
      console.error("❌ study_logs insert error:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }
    
    console.log("✅ insert success:", data);
    
    // loadMyHistory が定義されていれば実行
    if (typeof loadMyHistory === 'function') {
      console.log("🔄 Calling loadMyHistory...");
      loadMyHistory();
    } else {
      console.log("ℹ️ loadMyHistory function not available");
    }
  } catch (e) {
    console.error("❌ logStudyResult exception", e);
    console.error("Stack trace:", e.stack);
  }
}


