const menu = document.querySelector('#menu');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  document.querySelector('#navigation').classList.toggle('open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    menu?.setAttribute('aria-expanded', 'false');
    document.querySelector('#navigation')?.classList.remove('open');
  }
});
