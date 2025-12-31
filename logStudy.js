async function logStudyResult(q, isCorrect) {
  try {
    console.log("[logStudyResult] called", { qid: q?.id, isCorrect });

    // ① ログイン確認
    const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr) console.error("[auth.getUser] error", authErr);
    const user = authData?.user;

    console.log("[auth] user", user);

    if (!user) {
      console.warn("[logStudyResult] not logged in -> skip insert");
      return;
    }

    // ✅ ユーザー入力（仕訳）取得
    const userEntries = getUserEntries();  // { debit:[...], credit:[...] }

    // ✅ answer_json が NOT NULL なので、必ずオブジェクトを入れる
    const safeAnswerJson =
      (userEntries && typeof userEntries === "object")
        ? userEntries
        : { debit: [], credit: [] };

    // ② payload
    const payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(q.id || ""),
      action: "answer",
      is_correct: isCorrect,

      // ✅ 必須：NOT NULL の answer_json
      answer_json: safeAnswerJson,

      // ✅ 任意：補助情報
      metadata: {
        lang: currentLang,
        balanced: isBalanced(safeAnswerJson),
      }
    };

    // ✅ payload作成後にデバッグ表示（ここが正しい位置）
    console.log("[DEBUG] payload keys:", Object.keys(payload));
    console.log("[DEBUG] payload.answer_json:", payload.answer_json);
    console.log("[DEBUG] payload full:", JSON.stringify(payload, null, 2));

    console.log("[study_logs] insert payload", payload);

    // ③ insert（配列で）
    const { data, error } = await supabaseClient
      .from("study_logs")
      .insert([payload])
      .select();

    if (error) {
      console.error("study_logs insert error raw:", error);
      console.error("study_logs insert error JSON:", JSON.stringify(error, null, 2));
      alert("履歴保存エラー: " + (error.message || JSON.stringify(error)));
      return;
    }

    console.log("insert success:", data);

    // ④ 直後に select して本当に入ったか確認
    const { data: confirm, error: confirmErr } = await supabaseClient
      .from("study_logs")
      .select("id, user_id, content_id, created_at, is_correct")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    console.log("[study_logs] confirm select", { confirm, confirmErr });

    loadMyHistory();
  } catch (e) {
    console.error("[logStudyResult] exception", e);
    alert("履歴保存で例外: " + (e?.message || e));
  }
}
