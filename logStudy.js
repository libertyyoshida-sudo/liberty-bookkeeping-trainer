async function logStudyResult(q, isCorrect) {
  try {
    const { data: authData } = await supabaseClient.auth.getUser();
    const user = authData?.user;
    if (!user) return;

    // ユーザー入力（仕訳）
    const userEntries = getUserEntries();
    const safeAnswerJson =
      (userEntries && typeof userEntries === "object")
        ? userEntries
        : { debit: [], credit: [] };

    // 時刻（NOT NULL対策）
    const nowIso = new Date().toISOString(); // timestamptz ならISOでOK

    // ✅ DBの必須カラムに合わせる
    const payload = {
      user_id: user.id,
      content_type: "quiz",
      content_id: String(q.id || ""),
      is_correct: isCorrect,

      // ✅ NOT NULL
      answer_json: safeAnswerJson,

      // ✅ NOT NULL: meta（metadataじゃなく meta）
      meta: {
        lang: currentLang,
        action: "answer",
      },

      // ✅ NOT NULL: started_at / completed_at / created_at
      // 「started_at」は “問題を表示した時刻” を本当は入れたいが、
      // まずは最低限、保存成功を優先して now を入れる
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso
    };

    console.log("📦 payload just before insert:", payload);

    const { error } = await supabaseClient
      .from("study_logs")
      .insert([payload]);

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

