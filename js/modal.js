// მოდალური ფანჯარა (ვანილა JS, ბიბლიოთეკების გარეშე)

let overlay = null;
let lastFocused = null;

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function handleKeydown(e) {
  if (!overlay) return;
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    // ფოკუსის შენარჩუნება მოდალის შიგნით
    const items = overlay.querySelectorAll(FOCUSABLE);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export function closeModal() {
  if (!overlay) return;
  overlay.remove();
  overlay = null;
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', handleKeydown);
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

/**
 * openModal({ title, body, actions })
 * body: ტექსტი ან DOM ელემენტი
 * actions: [{ label, variant, href, onClick }]
 */
export function openModal({ title, body, actions = [] }) {
  closeModal();
  lastFocused = document.activeElement;

  overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'modal-title');

  const header = document.createElement('div');
  header.className = 'modal__header';
  const heading = document.createElement('h2');
  heading.id = 'modal-title';
  heading.textContent = title;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'modal__close';
  closeBtn.setAttribute('aria-label', 'დახურვა');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeModal);
  header.append(heading, closeBtn);

  const content = document.createElement('div');
  content.className = 'modal__body';
  if (typeof body === 'string') {
    const para = document.createElement('p');
    para.textContent = body;
    content.append(para);
  } else if (body) {
    content.append(body);
  }

  dialog.append(header, content);

  if (actions.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal__actions';
    actions.forEach((action) => {
      const el = action.href ? document.createElement('a') : document.createElement('button');
      if (action.href) el.href = action.href;
      else el.type = 'button';
      el.className = `btn ${action.variant || 'btn-outline'}`;
      el.textContent = action.label;
      el.addEventListener('click', () => {
        if (action.onClick) action.onClick();
        if (!action.href) closeModal();
      });
      footer.append(el);
    });
    dialog.append(footer);
  }

  overlay.append(dialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.body.append(overlay);
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', handleKeydown);

  const firstAction = dialog.querySelector('.modal__actions .btn');
  (firstAction || closeBtn).focus();
}
