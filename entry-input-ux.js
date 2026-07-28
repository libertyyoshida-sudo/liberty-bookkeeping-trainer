(() => {
  const amountSelector = [
    'input.amount-input',
    'input[id^="debit-amount-"]',
    'input[id^="credit-amount-"]'
  ].join(',');

  const digitsOnly = (value) => String(value || '').replace(/[^0-9]/g, '');
  const formatAmount = (value) => {
    const digits = digitsOnly(value).replace(/^0+(?=\d)/, '');
    return digits ? Number(digits).toLocaleString('en-JP') : '';
  };

  const nextField = (input) => {
    const row = input.closest('.entry-row');
    if (!row) return null;

    const fields = Array.from(row.querySelectorAll(
      '.account-search-input, select.account-select, input.amount-input, input[id^="debit-amount-"], input[id^="credit-amount-"]'
    )).filter((field) => field.offsetParent !== null && !field.disabled);

    const current = fields.indexOf(input);
    if (current >= 0 && fields[current + 1]) return fields[current + 1];

    const nextRow = row.nextElementSibling;
    return nextRow?.querySelector('.account-search-input, select.account-select, input');
  };

  const enhance = (input) => {
    if (input.dataset.mobileAmountReady === 'true') return;
    input.dataset.mobileAmountReady = 'true';
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
      const target = nextField(input);
      if (target) target.focus();
    });

    input.value = formatAmount(input.value);
  };

  const enhanceAll = () => document.querySelectorAll(amountSelector).forEach(enhance);

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
