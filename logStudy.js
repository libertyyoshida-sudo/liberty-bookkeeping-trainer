async function logStudyResult_TEST(q, isCorrect) {
  console.log("✅ VERSION: logStudyResult_TEST stable");

  try {
    if (!supabaseClient) {
      console.error("❌ Supabase client not initialized");
      return;
    }

    // ログイン中ユーザー取得
    var authRes = await supabaseClient.auth.getUser();
    var authData = authRes.data;
    var authErr = authRes.error;

    if (authErr) {
      console.error("[auth.getUser] error", authErr);
      return;
    }

    var user = authData && authData.user ? authData.user : null;
    console.log("👤 user:", user);

    if (!user) {
      console.warn("⚠️ not logged in - skipping study log");
      return;
    }

    var nowIso = new Date().toISOString();

    var qid = (q && q.id) ? q.id : "";

    var payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(qid),
      is_correct: isCorrect,
      answer_json: {
        test: "ok",
        question_id: qid,
        is_correct: isCorrect,
        timestamp: nowIso
      },
      meta: {
        lang: currentLang || "ja",
        action: "answer"
      },
      started_at: nowIso,
      completed_at: nowIso
      // created_at は入れない（Supabase側で自動生成に任せる）
    };

    console.log("📦 payload:", payload);

    var insertRes = await supabaseClient
      .from("study_logs")
      .insert([payload]);

    if (insertRes.error) {
      console.error("❌ insert error", insertRes.error);
      return;
    }

    console.log("✅ insert success");

    if (typeof loadMyHistory === "function") {
      loadMyHistory();
    }
  } catch (e) {
    console.error("❌ logStudyResult exception", e);
  }
}



