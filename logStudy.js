// logStudy.js
// 学習ログ保存 共通関数

const { createClient } = supabase;
window.supabaseClient = window.supabaseClient || createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

window.logStudy = async function ({ content_type, content_id, action, is_correct = null, metadata = null }) {
  try {
    const { data: authData } = await window.supabaseClient.auth.getUser();
    const user = authData?.user;
    if (!user) return; // 未ログイン時は何もしない

    const payload = {
      user_id: user.id,
      content_type,
      content_id,
      action,
      is_correct,
      metadata
    };

    const { error } = await window.supabaseClient.from("study_logs").insert([payload]);
    if (error) console.error("study_logs insert error", error);

  } catch (e) {
    console.error("logStudy error", e);
  }
};

