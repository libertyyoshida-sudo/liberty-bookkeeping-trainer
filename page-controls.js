(function () {
  const STORAGE_KEY = 'liberty-page-font-size-level';
  const levels = [
    { key: 0, labelJa: '文字サイズ: 標準', labelEn: 'Font size: Normal', size: '16px' },
    { key: 1, labelJa: '文字サイズ: 大', labelEn: 'Font size: Large', size: '18px' },
    { key: 2, labelJa: '文字サイズ: 特大', labelEn: 'Font size: X-Large', size: '20px' }
  ];

  let currentLevel = 0;

  function getLabel(level) {
    const isEnglish = (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('en');
    return isEnglish ? levels[level].labelEn : levels[level].labelJa;
  }

  function applyLevel(level) {
    currentLevel = level;
    const size = levels[level].size;

    document.documentElement.style.setProperty('--page-font-size', size);
    let styleEl = document.getElementById('liberty-page-font-size-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'liberty-page-font-size-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      :root { --page-font-size: ${size}; }
      body { font-size: var(--page-font-size) !important; }
      body * { font-size: inherit !important; }
    `;

    const button = document.getElementById('page-font-size-toggle');
    if (button) {
      button.textContent = getLabel(level);
    }
    localStorage.setItem(STORAGE_KEY, String(level));
  }

  function cycleLevel() {
    const next = (currentLevel + 1) % levels.length;
    applyLevel(next);
  }

  function init() {
    if (document.getElementById('page-font-size-toggle')) {
      return;
    }

    const saved = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    currentLevel = Number.isInteger(saved) ? saved : 0;

    const button = document.createElement('button');
    button.id = 'page-font-size-toggle';
    button.type = 'button';
    button.style.position = 'fixed';
    button.style.right = '16px';
    button.style.bottom = '16px';
    button.style.zIndex = '1500';
    button.style.border = '0';
    button.style.borderRadius = '999px';
    button.style.padding = '10px 14px';
    button.style.background = 'linear-gradient(135deg, #005bac, #00a0e9)';
    button.style.color = '#fff';
    button.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.16)';
    button.style.fontSize = '0.85rem';
    button.style.fontWeight = '700';
    button.style.cursor = 'pointer';
    button.textContent = getLabel(currentLevel);
    button.addEventListener('click', cycleLevel);

    document.body.appendChild(button);
    applyLevel(currentLevel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
