import { normalize, validate } from "./model.js";
export function completion(data) {
  const errors = validate(data);
  const checks = [
    !errors.name,
    !!data.title.trim(),
    !errors.email,
    !errors.phone,
    !!data.summary.trim(),
    data.experience.some((x) => x.title.trim()),
    data.education.some((x) => x.title.trim()),
    data.skills.some((x) => x.title.trim()),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
export function exportResume(data) {
  return JSON.stringify(
    { app: "cvbuilder", version: 1, resume: normalize(data) },
    null,
    2,
  );
}
export function importResume(text) {
  if (text.length > 1000000) throw new Error("ფაილის ზომა უნდა იყოს 1 MB-მდე.");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("ფაილი არ არის სწორი JSON ფორმატით.");
  }
  if (
    value?.app !== "cvbuilder" ||
    value.version !== 1 ||
    !value.resume ||
    typeof value.resume !== "object" ||
    Array.isArray(value.resume)
  )
    throw new Error("აირჩიე CVBuilder-იდან შენახული JSON ფაილი.");
  const resume = value.resume;
  for (const key of [
    "name",
    "title",
    "email",
    "phone",
    "city",
    "label",
    "summary",
  ]) {
    if (typeof resume[key] !== "string" || resume[key].length > 5000)
      throw new Error("ფაილში რეზიუმეს მონაცემები არასწორია.");
  }
  for (const key of ["experience", "education", "skills"]) {
    if (
      !Array.isArray(resume[key]) ||
      resume[key].length > 100 ||
      resume[key].some(
        (x) =>
          !x ||
          typeof x.title !== "string" ||
          typeof x.detail !== "string" ||
          x.title.length > 5000 ||
          x.detail.length > 5000,
      )
    )
      throw new Error("ფაილში სექციების მონაცემები არასწორია.");
  }
  return { ...normalize(resume), id: "" };
}
const draftKey = (id) => `cvbuilder_draft_v1_${id || "new"}`;
export function writeDraft(id, data, storage = localStorage) {
  storage.setItem(draftKey(id), JSON.stringify(normalize(data)));
}
export function readDraft(id, storage = localStorage) {
  const raw = storage.getItem(draftKey(id));
  return raw ? normalize(JSON.parse(raw)) : null;
}
export function clearDraft(id, storage = localStorage) {
  storage.removeItem(draftKey(id));
}
