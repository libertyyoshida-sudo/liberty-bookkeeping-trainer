(() => {
  const amountSelector = [
    'input.amount-input',
    'input[id^="debit-amount-"]',
    'input[id^="credit-amount-"]'
  ].join(',');
  const accountSelector = 'select.account-select';
  const entryFieldSelector = `${accountSelector}, ${amountSelector}`;

  const digitsOnly = (value) => String(value || '').replace(/[^0-9]/g, '');
  const formatAmount = (value) => {
    const digits = digitsOnly(value).replace(/^0+(?=\d)/, '');
    return digits ? Number(digits).toLocaleString('en-JP') : '';
  };

  const visibleFields = () => Array.from(document.querySelectorAll(entryFieldSelector))
    .filter((field) => field.offsetParent !== null && !field.disabled);

  const moveToNextField = (field) => {
    const fields = visibleFields();
    const current = fields.indexOf(field);
    const target = current >= 0 ? fields[current + 1] : null;

    if (target) {
      target.focus();
      return true;
    }

    const checkButton = document.querySelector('#check-answer, [data-action="check-answer"]');
    if (checkButton && checkButton.offsetParent !== null && !checkButton.disabled) {
      checkButton.focus();
      return true;
    }

    return false;
  };

  const normalizeAllAmounts = () => {
    document.querySelectorAll(amountSelector).forEach((input) => {
      input.value = digitsOnly(input.value);
    });
  };

  const restoreAllAmounts = () => {
    document.querySelectorAll(amountSelector).forEach((input) => {
      if (document.activeElement !== input) input.value = formatAmount(input.value);
    });
  };

  const enhanceAmount = (input) => {
    if (input.dataset.entryAmountReady === 'true') return;
    input.dataset.entryAmountReady = 'true';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.enterKeyHint = 'next';
    input.setAttribute('aria-label', input.getAttribute('aria-label') || '金額');

    input.addEventListener('focus', () => {
      input.value = digitsOnly(input.value);
      requestAnimationFrame(() => input.select());
    });

    input.addEventListener('input', () => {
      const digits = digitsOnly(input.value);
      if (input.value !== digits) input.value = digits;
    });

    input.addEventListener('blur', () => {
      input.value = formatAmount(input.value);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      input.value = formatAmount(input.value);
      moveToNextField(input);
    });

    input.value = formatAmount(input.value);
  };

  const enhanceAccount = (select) => {
    if (select.dataset.entryAccountReady === 'true') return;
    select.dataset.entryAccountReady = 'true';

    const side = select.id.startsWith('debit-') ? '借方' : '貸方';
    const row = select.id.match(/-(\d+)$/)?.[1];
    select.setAttribute(
      'aria-label',
      select.getAttribute('aria-label') || `${row ? `${row}行目の` : ''}${side}勘定科目`
    );

    select.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      moveToNextField(select);
    });
  };

  const installMobileActionStyles = () => {
    if (document.getElementById('entry-mobile-action-styles')) return;
    const style = document.createElement('style');
    style.id = 'entry-mobile-action-styles';
    style.textContent = `
      @media (max-width:760px) {
        .card-header > #toggle-ruby,
        .card-header > #toggle-easy-japanese,
        .card-header > [data-easy-japanese-toggle] {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          margin-left: 0 !important;
          padding: 8px 10px;
          white-space: nowrap;
        }
        .button-row {
          position: sticky;
          bottom: calc(72px + env(safe-area-inset-bottom));
          z-index: 900;
          margin: 12px -6px 0;
          padding: 8px 6px;
          border: 1px solid rgba(223,229,238,.95);
          border-radius: 14px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 -8px 24px rgba(16,35,63,.10);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .button-row #check-answer,
        .button-row [data-action="check-answer"] {
          min-height: 46px;
          font-size: .88rem;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(23,105,224,.22);
        }
        .button-row #prev-question,
        .button-row #next-question {
          min-height: 42px;
        }
        body.daily-dark .button-row {
          background: rgba(23,32,51,.96);
          border-color: #344158;
          box-shadow: 0 -8px 24px rgba(0,0,0,.24);
        }
        .entry-row:focus-within {
          border-color: var(--daily-blue,#1769e0);
          box-shadow: 0 0 0 3px rgba(23,105,224,.10);
        }
      }
    `;
    document.head.appendChild(style);
  };

  const enhanceAll = () => {
    installMobileActionStyles();
    document.querySelectorAll(amountSelector).forEach(enhanceAmount);
    document.querySelectorAll(accountSelector).forEach(enhanceAccount);
  };

  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('#check-answer, [data-action="check-answer"]')) return;
    normalizeAllAmounts();
    setTimeout(restoreAllAmounts, 0);
  }, true);

  document.addEventListener('submit', () => {
    normalizeAllAmounts();
    setTimeout(restoreAllAmounts, 0);
  }, true);

  window.addEventListener('liberty-before-grade', normalizeAllAmounts);
  window.addEventListener('liberty-after-grade', restoreAllAmounts);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAll, { once: true });
  } else {
    enhanceAll();
  }

  new MutationObserver(enhanceAll).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
