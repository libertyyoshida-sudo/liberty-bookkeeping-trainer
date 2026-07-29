(() => {
  const buildInsightCard = (className, label) => {
    const card = document.createElement('section');
    card.className = `desktop-insight-card ${className}`;
    card.setAttribute('aria-label', label);
    return card;
  };

  const installDesktopLayoutStyles = () => {
    if (document.getElementById('desktop-learning-layout-styles')) return;
    const style = document.createElement('style');
    style.id = 'desktop-learning-layout-styles';
    style.textContent = `
      .desktop-insights { display:grid; gap:16px; margin-top:16px; }
      .desktop-insight-card {
        min-width:0;
        padding:18px;
        border:1px solid rgba(17,74,132,.08);
        border-radius:18px;
        background:rgba(255,255,255,.96);
        box-shadow:0 10px 30px rgba(16,35,63,.07);
      }
      .desktop-insight-card .side-card-title,
      .desktop-insight-card .history-box-title {
        margin:0 0 12px;
        padding-bottom:10px;
        border-bottom:1px solid var(--border-soft);
        font-size:.95rem;
        font-weight:800;
        color:var(--text-main);
      }
      .desktop-insight-card .history-list {
        max-height:230px;
        margin-top:0;
      }
      .desktop-insight-card #ai-chat-box {
        min-height:120px;
        max-height:260px !important;
      }
      .desktop-progress-card #progress-help { margin:12px 0 0 !important; }

      @media (min-width:901px) {
        .page { max-width:1800px; padding:18px 20px 36px; }
        .layout { display:block; }
        .layout > section.card {
          width:100%;
          padding:20px 22px 22px;
          border-radius:20px;
          box-shadow:0 14px 36px rgba(16,35,63,.08);
        }
        .layout > aside.card { display:none !important; }
        .desktop-insights { grid-template-columns:minmax(230px,3fr) minmax(360px,5fr) minmax(300px,4fr); }
        .question-text {
          min-height:0;
          padding:16px 18px;
          font-size:clamp(1rem,1.25vw,1.35rem);
          line-height:1.78;
          border-color:rgba(23,105,224,.2);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
        }
        .entry-header-row,
        .entry-row {
          grid-template-columns:42px minmax(250px,1.55fr) minmax(120px,.55fr) minmax(250px,1.55fr) minmax(120px,.55fr);
          min-width:0;
          gap:8px;
        }
        .entry-row { padding:8px 10px; }
        .entry-row select,
        .entry-row .amount-input { min-height:38px; font-size:.9rem; }
        .button-row {
          justify-content:center;
          gap:14px;
          margin-top:14px;
        }
        .button-row .btn { min-width:170px; min-height:44px; justify-content:center; font-weight:700; }
        .button-row #check-answer { min-width:220px; font-size:.92rem; box-shadow:0 10px 24px rgba(0,91,172,.25); }
        .card-header {
          display:grid;
          grid-template-columns:auto auto 1fr;
          align-items:center;
          justify-content:initial;
          column-gap:14px;
          row-gap:10px;
        }
        .card-header .desktop-reading-tools {
          justify-self:end;
          display:flex;
          align-items:center;
          flex-wrap:wrap;
          justify-content:flex-end;
          gap:8px;
        }
        .card-header > .auth-small-btn,
        .card-header > div[style*="display:inline-flex"] { margin-left:0 !important; }
        #toggle-ruby {
          display:inline-flex !important;
          visibility:visible !important;
          align-items:center;
          justify-content:center;
          min-height:36px;
          padding:8px 13px;
          border:1px solid #ead58b;
          background:#fff4c7;
          color:#604800;
          font-weight:800;
          box-shadow:0 4px 12px rgba(96,72,0,.10);
        }
        .filter-row { gap:10px 12px; align-items:center; }
        .filter-row select { min-height:36px; }
      }

      @media (max-width:1100px) {
        .desktop-insights { grid-template-columns:1fr 1fr; }
        .desktop-history-card { grid-column:1 / -1; }
      }

      @media (max-width:900px) {
        .desktop-insights { grid-template-columns:1fr; margin-top:12px; }
        .desktop-history-card { grid-column:auto; }
        .desktop-insight-card { padding:14px; border-radius:16px; }
      }
    `;
    document.head.appendChild(style);
  };

  const groupDesktopHeaderTools = () => {
    const header = document.querySelector('.layout .card-header');
    if (!header || header.querySelector('.desktop-reading-tools')) return;

    const tools = document.createElement('div');
    tools.className = 'desktop-reading-tools';
    const candidates = [
      'btn-landscape',
      'btn-font-size',
      'btn-line-height',
      'btn-font-family',
      'btn-speech'
    ];
    candidates.forEach((id) => {
      const element = document.getElementById(id);
      if (element) tools.appendChild(element);
    });
    const speed = document.getElementById('speech-rate')?.parentElement;
    if (speed) tools.appendChild(speed);
    header.appendChild(tools);
  };

  const buildInsights = () => {
    const layout = document.querySelector('.layout');
    const aside = layout?.querySelector(':scope > aside.card');
    if (!layout || !aside || document.querySelector('.desktop-insights')) return;

    const insights = document.createElement('div');
    insights.className = 'desktop-insights';

    const progressCard = buildInsightCard('desktop-progress-card', '進捗');
    const progressTitle = aside.querySelector('[data-i18n="progress-title"]');
    const scoreBox = aside.querySelector('.score-box');
    const progressHelp = aside.querySelector('#progress-help');
    [progressTitle, scoreBox, progressHelp].forEach((node) => node && progressCard.appendChild(node));

    const aiCard = buildInsightCard('desktop-ai-card', 'AI解説');
    const aiTitle = aside.querySelector('[data-i18n="ai-explain-title"]');
    const aiWrapper = aiTitle?.parentElement;
    if (aiWrapper) {
      aiWrapper.style.marginTop = '0';
      aiCard.appendChild(aiWrapper);
    }

    const historyCard = buildInsightCard('desktop-history-card', '直近の学習履歴');
    const historyTitle = aside.querySelector('.history-box-title');
    const historyList = aside.querySelector('#history-list');
    [historyTitle, historyList].forEach((node) => node && historyCard.appendChild(node));

    insights.append(progressCard, aiCard, historyCard);
    layout.insertAdjacentElement('afterend', insights);
    aside.remove();
  };

  const initialize = () => {
    installDesktopLayoutStyles();
    groupDesktopHeaderTools();
    buildInsights();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once:true });
  } else {
    initialize();
  }
})();
