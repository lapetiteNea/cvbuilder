// რეზიუმეების შენახვა localStorage-ში

const KEY = "cvbuilder.cvs";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getAllCvs() {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getById(id) {
  return readAll().find((cv) => cv.id === id) || null;
}

// ინახავს ახალს ან განაახლებს არსებულს; წარუმატებლობისას აბრუნებს null-ს
export function saveCv(cv) {
  const list = readAll();
  const saved = {
    ...cv,
    id: cv.id || generateId(),
    updatedAt: new Date().toISOString(),
  };
  const index = list.findIndex((item) => item.id === saved.id);
  if (index >= 0) list[index] = saved;
  else list.push(saved);
  return writeAll(list) ? saved : null;
}

export function deleteCv(id) {
  return writeAll(readAll().filter((cv) => cv.id !== id));
}
