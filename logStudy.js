// 学習ログ保存（ログイン時のみ）
async function logStudyResult(q, isCorrect) {
  if (!window.sessionUser) return;

  try {
    const payload = {
      user_id: window.sessionUser.id,
      content_type: 'quiz',
      content_id: q.id,
      action: 'answer',         // ✅ 追加しておくと履歴ページでも便利
      is_correct: isCorrect,
      metadata: null            // ✅ 将来拡張用（選択肢など入れたいならここ）
      // created_at はSupabase側で自動付与
    };

    const { error } = await supabaseClient
      .from('study_logs')
      .insert([payload]);       // ✅ 配列でinsert

    if (error) {
      console.error('study_logs insert error', error);
    } else {
      loadMyHistory();
    }
  } catch (e) {
    console.error('logStudyResult exception', e);
  }
}


