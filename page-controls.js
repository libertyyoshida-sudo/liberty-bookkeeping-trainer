(function () {
  const STORAGE_KEY = 'liberty-page-font-size-level';
  const POS_KEY = 'liberty-page-font-size-pos';
  const HIDDEN_KEY = 'liberty-page-font-size-hidden';
  const LANG_KEY = 'liberty-lang';

  const levels = [
    { key: 0, labelJa: '文字サイズ: 標準', labelEn: 'Font size: Normal', size: '16px' },
    { key: 1, labelJa: '文字サイズ: 大', labelEn: 'Font size: Large', size: '18px' },
    { key: 2, labelJa: '文字サイズ: 特大', labelEn: 'Font size: X-Large', size: '20px' }
  ];

  let currentLevel = 0;
  let wrapper, button, closeBtn, restoreTab;

  function isEnglish() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'ja') return saved === 'en';
    return (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('en');
  }

  function getLabel(level) {
    return isEnglish() ? levels[level].labelEn : levels[level].labelJa;
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

    if (button) {
      button.textContent = getLabel(level);
    }
    localStorage.setItem(STORAGE_KEY, String(level));
  }

  function cycleLevel() {
    const next = (currentLevel + 1) % levels.length;
    applyLevel(next);
  }

  function savePos(left, top) {
    localStorage.setItem(POS_KEY, JSON.stringify({ left, top }));
  }

  function loadPos() {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return null;
      const pos = JSON.parse(raw);
      if (typeof pos.left === 'number' && typeof pos.top === 'number') return pos;
    } catch (e) {}
    return null;
  }

  function clampToViewport(left, top) {
    const rect = wrapper.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    return {
      left: Math.min(Math.max(8, left), maxLeft),
      top: Math.min(Math.max(8, top), maxTop)
    };
  }

  function setPosition(left, top) {
    const clamped = clampToViewport(left, top);
    wrapper.style.left = clamped.left + 'px';
    wrapper.style.top = clamped.top + 'px';
    wrapper.style.right = 'auto';
    wrapper.style.bottom = 'auto';
    savePos(clamped.left, clamped.top);
  }

  function enableDrag() {
    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0;
    let originLeft = 0, originTop = 0;

    function onPointerDown(e) {
      if (e.target === closeBtn) return;
      dragging = true;
      moved = false;
      const rect = wrapper.getBoundingClientRect();
      originLeft = rect.left;
      originTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      wrapper.setPointerCapture && wrapper.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      if (moved) {
        setPosition(originLeft + dx, originTop + dy);
      }
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        // ドラッグ操作だった場合はクリック（文字サイズ切替）を発火させない
        suppressNextClick = true;
      }
    }

    let suppressNextClick = false;
    button.addEventListener('click', (e) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      cycleLevel();
    });

    wrapper.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function hideWidget() {
    wrapper.style.display = 'none';
    restoreTab.style.display = 'flex';
    localStorage.setItem(HIDDEN_KEY, '1');
  }

  function showWidget() {
    wrapper.style.display = 'inline-flex';
    restoreTab.style.display = 'none';
    localStorage.setItem(HIDDEN_KEY, '0');
  }

  function init() {
    if (document.getElementById('page-font-size-toggle')) {
      return;
    }

    const saved = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    currentLevel = Number.isInteger(saved) ? saved : 0;

    wrapper = document.createElement('div');
    wrapper.id = 'page-font-size-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '12px';
    wrapper.style.right = '16px';
    wrapper.style.zIndex = '1500';
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.touchAction = 'none';
    wrapper.style.cursor = 'grab';

    button = document.createElement('button');
    button.id = 'page-font-size-toggle';
    button.type = 'button';
    button.style.border = '0';
    button.style.borderRadius = '999px';
    button.style.padding = '10px 30px 10px 14px';
    button.style.background = 'linear-gradient(135deg, #005bac, #00a0e9)';
    button.style.color = '#fff';
    button.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.16)';
    button.style.fontSize = '0.85rem';
    button.style.fontWeight = '700';
    button.style.cursor = 'inherit';
    button.textContent = getLabel(currentLevel);

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.title = isEnglish() ? 'Hide' : '非表示';
    closeBtn.setAttribute('aria-label', isEnglish() ? 'Hide font size control' : '文字サイズボタンを非表示にする');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.right = '2px';
    closeBtn.style.top = '50%';
    closeBtn.style.transform = 'translateY(-50%)';
    closeBtn.style.border = '0';
    closeBtn.style.background = 'rgba(255,255,255,0.25)';
    closeBtn.style.color = '#fff';
    closeBtn.style.width = '20px';
    closeBtn.style.height = '20px';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.fontSize = '0.8rem';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideWidget();
    });

    wrapper.style.position = 'fixed';
    button.style.position = 'relative';
    wrapper.appendChild(button);
    wrapper.appendChild(closeBtn);
    document.body.appendChild(wrapper);

    restoreTab = document.createElement('button');
    restoreTab.type = 'button';
    restoreTab.id = 'page-font-size-restore';
    restoreTab.textContent = 'Aa';
    restoreTab.title = isEnglish() ? 'Show font size control' : '文字サイズボタンを表示';
    restoreTab.style.position = 'fixed';
    restoreTab.style.top = '12px';
    restoreTab.style.right = '16px';
    restoreTab.style.zIndex = '1500';
    restoreTab.style.display = 'none';
    restoreTab.style.alignItems = 'center';
    restoreTab.style.justifyContent = 'center';
    restoreTab.style.width = '36px';
    restoreTab.style.height = '36px';
    restoreTab.style.borderRadius = '50%';
    restoreTab.style.border = '0';
    restoreTab.style.background = 'linear-gradient(135deg, #005bac, #00a0e9)';
    restoreTab.style.color = '#fff';
    restoreTab.style.fontWeight = '700';
    restoreTab.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.16)';
    restoreTab.style.cursor = 'pointer';
    restoreTab.addEventListener('click', showWidget);
    document.body.appendChild(restoreTab);

    const savedPos = loadPos();
    if (savedPos) {
      setPosition(savedPos.left, savedPos.top);
    }

    enableDrag();
    applyLevel(currentLevel);

    if (localStorage.getItem(HIDDEN_KEY) === '1') {
      hideWidget();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
