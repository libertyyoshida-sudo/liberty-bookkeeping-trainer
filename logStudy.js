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

    // ② payload（※カラム名は後で合わせます）
    const payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(q.id || ""),
      action: "answer",
      is_correct: isCorrect,
      metadata: {
        lang: currentLang,
        // user_entries: getUserEntries(), // ← 重いなら一旦コメントでもOK
      }
      // created_at はSupabase側の default now() に任せる
    };

    console.log("[study_logs] insert payload", payload);

    // ③ insert（配列で）
    const { data, error } = await supabaseClient
  .from('study_logs')
  .insert([payload])
  .select();

if (error) {
  console.error('study_logs insert error raw:', error);
  console.error('study_logs insert error JSON:', JSON.stringify(error, null, 2));
  alert("履歴保存エラー: " + (error.message || JSON.stringify(error)));
  return;
}
console.log("insert success:", data);

    // ④ 直後に select して本当に入ったか確認
    const { data: confirm, error: confirmErr } = await supabaseClient
      .from("study_logs")
      .select("id, user_id, content_id, created_at")
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



