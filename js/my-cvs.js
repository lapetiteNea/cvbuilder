// შენახული რეზიუმეების სია

import { getAllCvs, deleteCv } from "./storage.js";
import { TEMPLATES } from "./templates.js";
import { openModal } from "./modal.js";

const list = document.getElementById("cv-list");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildCard(cv) {
  const card = el("article", "card");
  const title =
    `${cv.firstName || ""} ${cv.lastName || ""}`.trim() || "უსახელო რეზიუმე";
  const template = TEMPLATES.find((t) => t.id === cv.template);
  const date = new Date(cv.updatedAt).toLocaleDateString("ka-GE");

  if (template) card.append(el("span", "badge", template.name));
  card.append(el("h3", "", title));
  card.append(el("p", "text-small", `შეიცვალა: ${date}`));

  const actions = el("div", "card__actions");
  const edit = el("a", "btn btn-outline", "რედაქტირება");
  edit.href = `editor.html?id=${encodeURIComponent(cv.id)}`;
  const del = el("button", "btn btn-danger", "წაშლა");
  del.type = "button";
  del.addEventListener("click", () => confirmDelete(cv, title));
  actions.append(edit, del);
  card.append(actions);
  return card;
}

function confirmDelete(cv, title) {
  openModal({
    title: "რეზიუმის წაშლა",
    body: `დარწმუნებული ხარ, რომ გინდა „${title}“ წაშლა? ეს მოქმედება ვერ გაუქმდება.`,
    actions: [
      {
        label: "წაშლა",
        variant: "btn-danger",
        onClick: () => {
          deleteCv(cv.id);
          render();
        },
      },
      { label: "გაუქმება", variant: "btn-outline" },
    ],
  });
}

function render() {
  const cvs = getAllCvs();
  if (cvs.length === 0) {
    const empty = el("article", "card");
    empty.append(
      el("h3", "", "ჯერ რეზიუმე არ გაქვს"),
      el("p", "", "შექმენი პირველი რეზიუმე რედაქტორში."),
    );
    const create = el("a", "btn btn-primary", "შექმნა");
    create.href = "editor.html";
    empty.append(create);
    list.replaceChildren(empty);
    return;
  }
  const create = el("article", "card");
  create.append(
    el("h3", "", "ახალი რეზიუმე"),
    el("p", "", "დაიწყე ახალი რეზიუმეს შექმნა."),
  );
  const link = el("a", "btn btn-primary", "შექმნა");
  link.href = "editor.html";
  create.append(link);
  list.replaceChildren(...cvs.map(buildCard), create);
}

if (list) render();
