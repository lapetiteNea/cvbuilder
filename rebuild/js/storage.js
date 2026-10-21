import { normalize } from './model.js';
const KEY = 'cvbuilder_rebuild_v1';
export function readAll(storage = localStorage) {
  const raw = storage.getItem(KEY);
  if (!raw) return [];
  let records;
  try { records = JSON.parse(raw); } catch { throw new Error('შენახული მონაცემები დაზიანებულია. არსებული ჩანაწერები არ შეცვლილა.'); }
  if (!Array.isArray(records)) throw new Error('შენახული მონაცემების ფორმატი არასწორია.');
  return records.map(normalize).filter(x => x.id);
}
export function save(data, storage = localStorage) {
  const records = readAll(storage), record = normalize(data);
  if (!record.id) record.id = globalThis.crypto.randomUUID();
  const index = records.findIndex(x => x.id === record.id);
  if (index < 0) records.push(record); else records[index] = record;
  storage.setItem(KEY, JSON.stringify(records));
  return record;
}
export function remove(id, storage = localStorage) {
  storage.setItem(KEY, JSON.stringify(readAll(storage).filter(x => x.id !== id)));
}
