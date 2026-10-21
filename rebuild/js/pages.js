import { readAll, remove } from './storage.js';
import { element } from './templates.js';
const list = document.querySelector('#saved-list');
if (list) {
  const dialog = document.querySelector('#delete-dialog'); let pending = null;
  function render() {
    list.replaceChildren();
    try {
      const query = document.querySelector('#search').value.toLocaleLowerCase();
      const records = readAll().filter(x => `${x.label} ${x.name} ${x.title}`.toLocaleLowerCase().includes(query));
      if (!records.length) {
        const empty = element('div',undefined,'empty'); empty.append(element('h2','აქ შენი შემდეგი ნაბიჯი დაიწყება.'),element('p','რეზიუმე ჯერ არ არის ან ძიებას არ ემთხვევა.'));
        const link = element('a','შექმენი რეზიუმე ↗','button'); link.href='editor.html'; empty.append(link); list.append(empty);
      }
      for (const record of records) {
        const card = element('article',undefined,'card'); card.append(element('h2',record.label || record.name),element('p',record.title || 'რეზიუმე'));
        const actions = element('div',undefined,'actions'), link = element('a','რედაქტირება ↗','button'); link.href=`editor.html?id=${encodeURIComponent(record.id)}`;
        const button = element('button','წაშლა','secondary'); button.addEventListener('click', () => { pending=record.id; dialog.showModal(); });
        actions.append(link,button); card.append(actions); list.append(card);
      }
    } catch { list.append(element('p','შენახული მონაცემების წაკითხვა ვერ მოხერხდა. ბრაუზერის პარამეტრები შეამოწმე.')); }
  }
  document.querySelector('#search').addEventListener('input',render);
  document.querySelector('#cancel-delete').addEventListener('click',()=>dialog.close());
  document.querySelector('#confirm-delete').addEventListener('click',()=>{
    try { remove(pending); dialog.close(); render(); document.querySelector('#search').focus(); }
    catch { dialog.close(); list.prepend(element('p','წაშლა ვერ მოხერხდა. სცადე ხელახლა.')); }
  });
  render();
}
const contact = document.querySelector('#contact-form');
contact?.addEventListener('submit', event => {
  event.preventDefault();
  if (!contact.reportValidity()) return;
  document.querySelector('#contact-status').textContent = '✓ ფორმა სწორადაა შევსებული. ეს დემოა — შეტყობინება არ გაგზავნილა.';
});
