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
  preview();
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
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
drawSections();
showPhoto();
preview();
