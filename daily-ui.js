(() => {
  const DAILY_GOAL = 5;
  const STORAGE_KEY = "liberty-daily-learning";
  const PROFILE_KEY = "liberty-learning-profile";
  const THEME_KEY = "liberty-daily-theme";
  const todayKey = () => new Date().toISOString().slice(0, 10);

  function loadDailyState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.date !== todayKey()) return { date: todayKey(), answered: 0, correct: 0 };
      return { date: todayKey(), answered: Number(saved.answered || 0), correct: Number(saved.correct || 0) };
    } catch { return { date: todayKey(), answered: 0, correct: 0 }; }
  }
  function saveDailyState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      return { xp:Number(saved.xp||0), totalAnswered:Number(saved.totalAnswered||0), totalCorrect:Number(saved.totalCorrect||0), unlocked:Array.isArray(saved.unlocked)?saved.unlocked:[] };
    } catch { return { xp:0,totalAnswered:0,totalCorrect:0,unlocked:[] }; }
  }
  function saveProfile(profile) { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
  function levelFromXp(xp) { return Math.max(1, Math.floor(xp / 100) + 1); }
  function rankFromLevel(level) { return level>=10?"経営者":level>=7?"総支配人":level>=5?"支配人":level>=3?"番頭":"見習い"; }

  function estimateStreak() {
    try {
      const raw = localStorage.getItem("studyHistory") || localStorage.getItem("study_logs") || "[]";
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || !items.length) return 0;
      const dates = [...new Set(items.map(item => String(item.date || item.created_at || item.timestamp || "").slice(0,10)).filter(Boolean))].sort().reverse();
      let streak=0; const cursor=new Date();
      for (const date of dates) { if (date===cursor.toISOString().slice(0,10)) { streak++; cursor.setDate(cursor.getDate()-1); } }
      return streak;
    } catch { return 0; }
  }

  function readWeakCategories() {
    const keys=["weakCategories","weak_categories","bookkeepingWeakCategories"];
    for (const key of keys) {
      try {
        const parsed=JSON.parse(localStorage.getItem(key)||"null");
        if (Array.isArray(parsed) && parsed.length) return parsed.map(String);
      } catch {}
    }
    return [];
  }

  function coachAdvice(profile,daily) {
    const accuracy=profile.totalAnswered ? Math.round(profile.totalCorrect/profile.totalAnswered*100) : null;
    const weak=readWeakCategories();
    if (daily.answered>=DAILY_GOAL) return {icon:"🎉",title:"今日の目標を達成しました",text:"よくできました。余力があれば苦手優先モードで3問だけ復習しましょう。",action:"苦手を復習",mode:"weak"};
    if (weak.length) return {icon:"🤖",title:`今日は「${weak[0]}」を重点復習`,text:"登録された苦手分野から始めると、短時間でも学習効果を高められます。",action:"おすすめ学習を開始",mode:"weak"};
    if (accuracy!==null && accuracy<70) return {icon:"🧭",title:"基礎をゆっくり固めましょう",text:`現在の累計正答率は${accuracy}%です。問題数を5問に絞り、解説を確認しながら進めるのがおすすめです。`,action:"5問トレーニング",mode:"basic"};
    if (profile.totalAnswered>=10) return {icon:"🚀",title:"次は復習モードがおすすめ",text:`累計${profile.totalAnswered}問を学習しました。過去に間違えた問題を優先すると定着しやすくなります。`,action:"ミスを復習",mode:"review"};
    return {icon:"🌱",title:"まずは今日の5問から",text:"最初は速さより、借方と貸方で何が増減したかを確認することを意識しましょう。",action:"今日の学習を開始",mode:"basic"};
  }

  function applyRecommendedMode(mode) {
    const count=document.getElementById("question-count") || document.getElementById("question-count-select");
    if (count) {
      const five=[...count.options].find(o=>String(o.value)==="5" || /5/.test(o.textContent));
      if (five) count.value=five.value;
    }
    const weak=document.getElementById("weak-only") || document.getElementById("weak-only-checkbox");
    const review=document.getElementById("review-only") || document.getElementById("review-checkbox");
    if (weak && "checked" in weak) weak.checked=mode==="weak";
    if (review && "checked" in review) review.checked=mode==="review";
    document.getElementById("practice")?.scrollIntoView({behavior:"smooth",block:"start"});
    window.setTimeout(()=>document.getElementById("btn-start-session")?.click(),350);
  }

  function applyTheme() {
    const saved=localStorage.getItem(THEME_KEY);
    const dark=saved==="dark" || (!saved && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("daily-dark",dark);
  }
  function toggleTheme() {
    const dark=!document.body.classList.contains("daily-dark");
    document.body.classList.toggle("daily-dark",dark);
    localStorage.setItem(THEME_KEY,dark?"dark":"light");
    const button=document.querySelector(".daily-theme-toggle"); if(button) button.textContent=dark?"☀️":"🌙";
  }

  function achievements(profile,daily,streak) {
    return [
      {id:"first",icon:"🌱",label:"初めの一歩",unlocked:profile.totalAnswered>=1},
      {id:"three",icon:"🎯",label:"3問正解",unlocked:profile.totalCorrect>=3},
      {id:"daily",icon:"🏁",label:"目標達成",unlocked:daily.answered>=DAILY_GOAL},
      {id:"ten",icon:"📘",label:"10問学習",unlocked:profile.totalAnswered>=10},
      {id:"perfect",icon:"💎",label:"正答率80%",unlocked:profile.totalAnswered>=5&&profile.totalCorrect/profile.totalAnswered>=.8},
      {id:"streak7",icon:"🔥",label:"7日連続",unlocked:streak>=7}
    ];
  }
  function showToast(message) {
    let toast=document.querySelector(".daily-toast");
    if(!toast){toast=document.createElement("div");toast.className="daily-toast";document.body.appendChild(toast);}
    toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200);
  }

  function injectDashboard() {
    applyTheme();
    const page=document.querySelector(".page"),header=page?.querySelector("header"),layout=page?.querySelector(".layout");
    if(!page||!header||!layout||document.querySelector(".daily-dashboard")) return;
    layout.id="practice";layout.classList.add("practice-anchor");
    const state=loadDailyState(),profile=loadProfile(),progress=Math.min(100,Math.round(state.answered/DAILY_GOAL*100)),streak=estimateStreak();
    const level=levelFromXp(profile.xp),rank=rankFromLevel(level),xpInLevel=profile.xp%100,badges=achievements(profile,state,streak),coach=coachAdvice(profile,state);

    const dashboard=document.createElement("section");dashboard.className="daily-dashboard";
    dashboard.innerHTML=`
      <div class="daily-hero"><div class="daily-kicker">DAILY BOOKKEEPING</div><h2 class="daily-title">今日も1問から始めよう</h2><p class="daily-subtitle">短い積み重ねが、現場で使える会計力になります。</p><button type="button" class="daily-theme-toggle" aria-label="表示テーマを切り替える">${document.body.classList.contains("daily-dark")?"☀️":"🌙"}</button><div class="daily-stats"><div class="daily-stat"><strong>🔥 ${streak}</strong><span>連続学習日</span></div><div class="daily-stat"><strong id="daily-level">Lv.${level}</strong><span id="daily-rank">${rank}</span></div><div class="daily-stat"><strong id="daily-goal">${state.answered}/${DAILY_GOAL}</strong><span>今日の目標</span></div></div></div>
      <div class="daily-coach" id="daily-coach"><div class="daily-coach-avatar">${coach.icon}</div><div class="daily-coach-copy"><span>AI STUDY COACH</span><strong>${coach.title}</strong><p>${coach.text}</p></div><button type="button" class="daily-coach-action" data-mode="${coach.mode}">${coach.action}</button></div>
      <div class="daily-grid">
        <div class="daily-card"><div class="daily-progress-head"><div><h2>今日の学習</h2><strong>${state.answered}問完了</strong></div><span>${progress}%</span></div><div class="daily-progress-track" aria-label="今日の学習進捗"><div class="daily-progress-bar" style="width:${progress}%"></div></div><button type="button" class="daily-primary" id="daily-start">▶ 今日の学習を始める</button><div class="daily-tip"><span class="daily-tip-icon">💡</span><p><strong>今日の会計豆知識</strong><br>仕訳は「何が増え、何が減ったか」を先に考えると整理しやすくなります。</p></div></div>
        <div class="daily-card"><h2>デイリーミッション</h2><div class="daily-mission ${state.answered>=1?"done":""}"><span class="daily-check">${state.answered>=1?"✓":"1"}</span><div><strong>まず1問解く</strong><small>毎日の習慣をつくる</small></div></div><div class="daily-mission ${state.correct>=3?"done":""}"><span class="daily-check">${state.correct>=3?"✓":"3"}</span><div><strong>3問正解する</strong><small>正確さを伸ばす</small></div></div><div class="daily-mission ${state.answered>=DAILY_GOAL?"done":""}"><span class="daily-check">${state.answered>=DAILY_GOAL?"✓":"5"}</span><div><strong>目標を達成する</strong><small>今日の5問を完了</small></div></div></div>
        <div class="daily-card"><h2>レベルとEXP</h2><div class="daily-level-row"><strong id="daily-level-detail">Lv.${level} ${rank}</strong><small id="daily-xp-label">${xpInLevel}/100 EXP</small></div><div class="daily-xp-track"><div class="daily-xp-bar" style="width:${xpInLevel}%"></div></div><small>正解で10 EXP、不正解でも2 EXP獲得します。</small></div>
        <div class="daily-card"><h2>バッジ</h2><div class="daily-achievements">${badges.map(b=>`<div class="daily-badge ${b.unlocked?"unlocked":""}" data-badge="${b.id}"><b>${b.icon}</b><span>${b.label}</span></div>`).join("")}</div></div>
      </div>`;
    header.insertAdjacentElement("afterend",dashboard);

    const nav=document.createElement("nav");nav.className="daily-bottom-nav";nav.setAttribute("aria-label","メインナビゲーション");nav.innerHTML=`<button type="button" class="active" data-target="top"><b>🏠</b><span>ホーム</span></button><button type="button" data-target="practice"><b>✏️</b><span>学習</span></button><a href="history.html"><b>📊</b><span>履歴</span></a><a href="analytics.html"><b>📈</b><span>分析</span></a><a href="contents.html"><b>🎥</b><span>教材</span></a>`;document.body.appendChild(nav);
    document.querySelector(".daily-theme-toggle")?.addEventListener("click",toggleTheme);
    document.querySelector(".daily-coach-action")?.addEventListener("click",e=>applyRecommendedMode(e.currentTarget.dataset.mode));
    document.getElementById("daily-start")?.addEventListener("click",()=>applyRecommendedMode("basic"));
    nav.querySelector('[data-target="top"]')?.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
    nav.querySelector('[data-target="practice"]')?.addEventListener("click",()=>document.getElementById("practice")?.scrollIntoView({behavior:"smooth"}));
    trackAnswers();
  }

  function trackAnswers() {
    const result=document.getElementById("result-message");if(!result)return;let previous=result.textContent;
    const observer=new MutationObserver(()=>{
      const current=result.textContent.trim();if(!current||current===previous)return;previous=current;
      const correct=/正解|correct/i.test(current)&&!/不正解|incorrect/i.test(current),daily=loadDailyState(),profile=loadProfile(),beforeLevel=levelFromXp(profile.xp),beforeBadges=new Set(profile.unlocked);
      daily.answered++;if(correct)daily.correct++;profile.totalAnswered++;if(correct)profile.totalCorrect++;profile.xp+=correct?10:2;
      const streak=estimateStreak(),earned=achievements(profile,daily,streak).filter(i=>i.unlocked).map(i=>i.id);profile.unlocked=[...new Set([...profile.unlocked,...earned])];saveDailyState(daily);saveProfile(profile);updateDashboard(daily,profile,streak);
      const afterLevel=levelFromXp(profile.xp);if(afterLevel>beforeLevel)showToast(`🎉 レベルアップ！ Lv.${afterLevel} ${rankFromLevel(afterLevel)}`);else{const newBadge=profile.unlocked.find(id=>!beforeBadges.has(id));if(newBadge){const badge=achievements(profile,daily,streak).find(i=>i.id===newBadge);if(badge)showToast(`🏅 バッジ獲得：${badge.label}`);}else showToast(correct?"+10 EXP 正解です！":"+2 EXP 次の問題へ進みましょう");}
    });observer.observe(result,{childList:true,subtree:true,characterData:true});
  }

  function updateDashboard(daily,profile,streak) {
    const progress=Math.min(100,Math.round(daily.answered/DAILY_GOAL*100)),level=levelFromXp(profile.xp),rank=rankFromLevel(level),xpInLevel=profile.xp%100;
    const strong=document.querySelector(".daily-progress-head strong"),percent=document.querySelector(".daily-progress-head>span"),bar=document.querySelector(".daily-progress-bar");if(strong)strong.textContent=`${daily.answered}問完了`;if(percent)percent.textContent=`${progress}%`;if(bar)bar.style.width=`${progress}%`;
    const set=(id,text)=>document.getElementById(id)?.replaceChildren(document.createTextNode(text));set("daily-goal",`${daily.answered}/${DAILY_GOAL}`);set("daily-level",`Lv.${level}`);set("daily-rank",rank);set("daily-level-detail",`Lv.${level} ${rank}`);set("daily-xp-label",`${xpInLevel}/100 EXP`);
    const xpBar=document.querySelector(".daily-xp-bar");if(xpBar)xpBar.style.width=`${xpInLevel}%`;
    achievements(profile,daily,streak).forEach(item=>document.querySelector(`[data-badge="${item.id}"]`)?.classList.toggle("unlocked",item.unlocked));
    const missions=document.querySelectorAll(".daily-mission"),states=[daily.answered>=1,daily.correct>=3,daily.answered>=DAILY_GOAL];missions.forEach((mission,index)=>{mission.classList.toggle("done",states[index]);const check=mission.querySelector(".daily-check");if(check)check.textContent=states[index]?"✓":String([1,3,5][index]);});
    const coach=coachAdvice(profile,daily),card=document.getElementById("daily-coach");if(card){card.querySelector(".daily-coach-avatar").textContent=coach.icon;card.querySelector(".daily-coach-copy strong").textContent=coach.title;card.querySelector(".daily-coach-copy p").textContent=coach.text;const action=card.querySelector(".daily-coach-action");action.textContent=coach.action;action.dataset.mode=coach.mode;}
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",injectDashboard);else injectDashboard();
})();