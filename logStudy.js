async function logStudyResult_TEST(q, isCorrect) {
  console.log("✅ VERSION: logStudyResult_TEST stable + profiles auto create (with nationality)");

  try {
    if (!supabaseClient) {
      console.error("❌ Supabase client not initialized");
      return;
    }

    // 1) ログイン中ユーザー取得
    var authRes = await supabaseClient.auth.getUser();
    var authData = authRes.data;
    var authErr  = authRes.error;

    if (authErr) {
      console.error("[auth.getUser] error", authErr);
      return;
    }

    var user = (authData && authData.user) ? authData.user : null;
    console.log("👤 user:", user);

    if (!user) {
      console.warn("⚠️ not logged in - skipping study log");
      return;
    }

    // 2) profiles確認
    console.log("🔍 checking profiles...");
    var profRes = await supabaseClient
      .from("profiles")
      .select("id, email, nationality")
      .eq("id", user.id)
      .maybeSingle();

    if (profRes.error) {
      console.error("❌ profiles select error", profRes.error);
      return;
    }

    // 3) profiles無ければ作成（nationality必須）
    if (!profRes.data) {
      console.log("🆕 profiles not found → creating...");

      var createProfileRes = await supabaseClient
        .from("profiles")
        .insert([{
          id: user.id,
          email: user.email,
          nationality: "unknown",   // ✅ 必須カラムなので暫定値
          role: "user"              // デフォルトでもOKだが明示してもよい
        }]);

      if (createProfileRes.error) {
        console.error("❌ profiles insert error", createProfileRes.error);
        return;
      }

      console.log("✅ profiles created");
    } else {
      console.log("✅ profiles exists");
    }

    // 4) study_logs insert
    var nowIso = new Date().toISOString();
    var qid = (q && q.id) ? q.id : "";

    var payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(qid),
      is_correct: isCorrect,
      answer_json: {
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
    };

    console.log("📦 payload:", payload);

    var insertRes = await supabaseClient
      .from("study_logs")
      .insert([payload]);

    if (insertRes.error) {
      console.error("❌ study_logs insert error", insertRes.error);
      return;
    }

    console.log("✅ study_logs insert success");

    if (typeof loadMyHistory === "function") {
      loadMyHistory();
    }

  } catch (e) {
    console.error("❌ logStudyResult exception", e);
    if (e && e.stack) console.error("Stack trace:", e.stack);
  }
}




