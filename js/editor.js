import {
  completion,
  exportResume,
  importResume,
  writeDraft,
  readDraft,
  clearDraft,
} from "./workspace.js";
import { preparePhoto } from "./photo.js";
import {
  emptyResume,
  normalize,
  validate,
  moveSection,
  templates,
} from "./model.js";
import { readAll, save } from "./storage.js";
import { element, renderResume } from "./templates.js";
const form = document.querySelector("#cv-form"),
  status = document.querySelector("#status");
const params = new URLSearchParams(location.search);
let data = emptyResume(),
  dirty = false;
try {
  if (params.has("id")) {
    const saved = readAll().find((x) => x.id === params.get("id"));
    if (saved) data = normalize(saved);
    else status.textContent = "რეზიუმე ვერ მოიძებნა. გახსნილია ახალი ფორმა.";
  }
} catch {
  status.textContent =
    "მონაცემების წაკითხვა ვერ მოხერხდა. ბრაუზერის შენახვის პარამეტრები შეამოწმე.";
}
if (templates.includes(params.get("template")))
  data.template = params.get("template");
const fields = [
  "name",
  "title",
  "email",
  "phone",
  "city",
  "label",
  "summary",
  "template",
  "color",
];
fields.forEach((key) => {
  form.elements.namedItem(key).value = data[key];
});
const preview = () =>
  renderResume(document.querySelector("#resume-preview"), data);
const photoInput = document.querySelector("#photo-input");
const photoStatus = document.querySelector("#photo-status");
const photoThumbnail = document.querySelector("#photo-thumbnail");
const removePhoto = document.querySelector("#remove-photo");
let photoRequest = 0,
  photoBusy = false;
function showPhoto() {
  photoThumbnail.hidden = !data.photo;
  removePhoto.hidden = !data.photo && !photoBusy;
  if (data.photo) photoThumbnail.src = data.photo;
  else photoThumbnail.removeAttribute("src");
}
photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;
  const request = ++photoRequest;
  dirty = true;
  photoBusy = true;
  photoStatus.textContent = "ფოტო მუშავდება…";
  showPhoto();
  try {
    const photo = await preparePhoto(file);
    if (request !== photoRequest) return;
    data.photo = photo;
    update();
    photoStatus.textContent =
      "ფოტო დაემატა. ცვლილების დასატოვებლად დააჭირე შენახვას.";
  } catch (error) {
    if (request === photoRequest) photoStatus.textContent = error.message;
  } finally {
    if (request === photoRequest) {
      photoBusy = false;
      photoInput.value = "";
      showPhoto();
    }
  }
});
removePhoto.addEventListener("click", () => {
  ++photoRequest;
  photoBusy = false;
  data.photo = "";
  photoInput.value = "";
  photoStatus.textContent =
    "ფოტო წაიშალა. ცვლილების დასატოვებლად დააჭირე შენახვას.";
  showPhoto();
  update();
  photoInput.focus();
});
function update() {
  dirty = true;
  draftSaved = false;
  preview();
  updateProgress();
  clearTimeout(draftTimer);
  draftStatus.textContent = "მონახაზი ინახება…";
  draftTimer = setTimeout(flushDraft, 500);
}
form.addEventListener("input", (event) => {
  if (fields.includes(event.target.name)) {
    data[event.target.name] = event.target.value;
    update();
  }
});
const titles = {
  experience: "02 / გამოცდილება",
  education: "03 / განათლება",
  skills: "04 / უნარები",
};
function drawSections(focusId) {
  const container = document.querySelector("#sections");
  container.replaceChildren();
  data.order.forEach((type, index) => {
    const group = element("fieldset");
    group.append(element("legend", titles[type]));
    const controls = element("div", undefined, "section-controls");
    for (const [direction, label] of [
      [-1, "↑ ზევით"],
      [1, "↓ ქვევით"],
    ]) {
      const button = element("button", label, "secondary");
      button.type = "button";
      button.id = `${type}-move-${direction}`;
      button.setAttribute("aria-label", `${titles[type]} ${label}`);
      button.disabled =
        index + direction < 0 || index + direction >= data.order.length;
      button.addEventListener("click", () => {
        data.order = moveSection(data.order, index, direction);
        update();
        drawSections(button.id);
      });
      controls.append(button);
    }
    group.append(controls);
    data[type].forEach((entry, i) => {
      const wrapper = element("div", undefined, "entry");
      for (const key of type === "skills" ? ["title"] : ["title", "detail"]) {
        const id = `${type}-${i}-${key}`;
        const label = element(
          "label",
          key === "detail"
            ? "პერიოდი და აღწერა"
            : type === "skills"
              ? "უნარი"
              : type === "education"
                ? "სასწავლებელი / ხარისხი"
                : "პოზიცია / კომპანია",
        );
        label.htmlFor = id;
        const input = element(key === "detail" ? "textarea" : "input");
        input.id = id;
        input.value = entry[key];
        input.maxLength = key === "detail" ? 2000 : 200;
        if (type === "skills") input.setAttribute("list", "skill-suggestions");
        input.addEventListener("input", () => {
          entry[key] = input.value;
          update();
        });
        wrapper.append(label, input);
      }
      const remove = element("button", "ჩანაწერის წაშლა", "secondary remove");
      remove.type = "button";
      remove.addEventListener("click", () => {
        data[type].splice(i, 1);
        update();
        drawSections(`${type}-add`);
      });
      wrapper.append(remove);
      group.append(wrapper);
    });
    const add = element("button", "+ დამატება", "secondary");
    add.type = "button";
    add.id = `${type}-add`;
    add.addEventListener("click", () => {
      data[type].push({ title: "", detail: "" });
      update();
      drawSections(`${type}-${data[type].length - 1}-title`);
    });
    group.append(add);
    container.append(group);
  });
  if (focusId) document.getElementById(focusId)?.focus();
}
function check() {
  if (photoBusy) {
    status.textContent = "დაელოდე ფოტოს დამუშავების დასრულებას.";
    return false;
  }
  const errors = validate(data);
  for (const key of ["name", "email", "phone"]) {
    const input = form.elements.namedItem(key);
    input.setAttribute("aria-invalid", String(Boolean(errors[key])));
    document.getElementById(`${key}-error`).textContent = errors[key] || "";
  }
  const first = Object.keys(errors)[0];
  if (first) {
    form.elements.namedItem(first).focus();
    status.textContent = "გთხოვ, გაასწორე მონიშნული ველები.";
  }
  return !first;
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!check()) return;
  try {
    data = save(data);
    clearTimeout(draftTimer);
    try {
      clearDraft(draftId);
    } catch {}
    draftId = data.id;
    recovery.hidden = true;
    draftStatus.textContent = "რეზიუმე შენახულია „ჩემი რეზიუმეების“ სიაში.";
    dirty = false;
    history.replaceState(null, "", `?id=${encodeURIComponent(data.id)}`);
    status.textContent = "✓ რეზიუმე შენახულია. იხილე „ჩემი რეზიუმეები“.";
    drawSections();
  } catch {
    status.textContent =
      "შენახვა ვერ მოხერხდა. მონაცემები ფორმაში დარჩა. სცადე ბეჭდვა / PDF.";
  }
});
document.querySelector("#print").addEventListener("click", async () => {
  if (!check()) return;
  try {
    await Promise.all(
      [...document.querySelectorAll("#resume-preview img")].map((image) =>
        image.decode(),
      ),
    );
    window.print();
  } catch {
    status.textContent =
      "ფოტოს ჩატვირთვა ვერ მოხერხდა. ხელახლა ატვირთე ფოტო და სცადე ბეჭდვა.";
  }
});
window.addEventListener("beforeunload", (event) => {
  if (dirty && (!draftSaved || photoBusy)) {
    event.preventDefault();
    event.returnValue = "";
  }
});
const draftStatus = document.querySelector("#draft-status");
const recovery = document.querySelector("#draft-recovery");
let draftId = params.get("id") || "",
  draftTimer,
  draftSaved = false,
  recovered;
function updateProgress() {
  const value = completion(data);
  document.querySelector("#cv-progress").value = value;
  document.querySelector("#progress-value").textContent = `${value}%`;
}
function flushDraft() {
  if (!dirty || photoBusy) return;
  try {
    writeDraft(draftId, data);
    draftSaved = true;
    draftStatus.textContent = "✓ მონახაზი ავტომატურად შენახულია ამ ბრაუზერში.";
  } catch {
    draftSaved = false;
    draftStatus.textContent =
      "მონახაზი ვერ შეინახა. გამოიყენე „შენახვა“ ან „ფაილად შენახვა“.";
  }
}
function fillEditor() {
  for (const key of fields) form.elements.namedItem(key).value = data[key];
  for (const key of ["name", "email", "phone"]) {
    form.elements.namedItem(key).removeAttribute("aria-invalid");
    document.getElementById(`${key}-error`).textContent = "";
  }
  drawSections();
  showPhoto();
  preview();
  updateProgress();
}
try {
  recovered = readDraft(draftId);
  recovery.hidden = !recovered;
} catch {
  draftStatus.textContent =
    "ძველი მონახაზი ვერ გაიხსნა. შეგიძლია ახალი რეზიუმე შეავსო.";
}
document.querySelector("#restore-draft").addEventListener("click", () => {
  data = { ...recovered, id: draftId };
  recovery.hidden = true;
  fillEditor();
  update();
  status.textContent =
    "მონახაზი აღდგენილია. საბოლოო ვერსიისთვის დააჭირე შენახვას.";
});
document.querySelector("#discard-draft").addEventListener("click", () => {
  try {
    clearDraft(draftId);
    recovery.hidden = true;
    draftStatus.textContent = "მონახაზი წაიშალა.";
  } catch {
    draftStatus.textContent = "მონახაზის წაშლა ვერ მოხერხდა.";
  }
});
document.querySelector("#export-cv").addEventListener("click", () => {
  if (photoBusy) {
    status.textContent = "დაელოდე ფოტოს დამუშავების დასრულებას.";
    return;
  }
  const url = URL.createObjectURL(
    new Blob([exportResume(data)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "my-resume.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent =
    "JSON ფაილით შეძლებ რეზიუმეს სხვა ბრაუზერშიც გახსნას. PDF-ისთვის გამოიყენე ბეჭდვა.";
});
const importInput = document.querySelector("#import-cv");
let importRequest = 0;
importInput.addEventListener("change", async () => {
  const file = importInput.files[0];
  if (!file) return;
  const request = ++importRequest;
  try {
    if (file.size > 1000000) throw new Error("ფაილის ზომა უნდა იყოს 1 MB-მდე.");
    const imported = importResume(await file.text());
    if (request !== importRequest) return;
    if (
      (dirty || data.name || data.summary) &&
      !window.confirm("ფაილიდან გახსნა მიმდინარე ფორმას შეცვლის. გავაგრძელოთ?")
    )
      return;
    ++photoRequest;
    photoBusy = false;
    photoInput.value = "";
    clearTimeout(draftTimer);
    data = imported;
    draftId = "";
    history.replaceState(null, "", location.pathname);
    recovery.hidden = true;
    fillEditor();
    update();
    status.textContent =
      "ფაილი გახსნილია როგორც ახალი რეზიუმე. შენახული ვერსიები არ შეცვლილა.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    if (request === importRequest) importInput.value = "";
  }
});
window.addEventListener("pagehide", flushDraft);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushDraft();
});
fillEditor();
