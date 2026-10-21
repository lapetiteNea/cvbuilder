// შაბლონების მონაცემები, რეზიუმეს რენდერი და შაბლონების გვერდის ლოგიკა

import { openModal } from "./modal.js";

export const TEMPLATES = [
  {
    id: "classic",
    name: "კლასიკური",
    category: "formal",
    categoryLabel: "ფორმალური",
    description:
      "მკაფიო, ტრადიციული განლაგება იურიდიული და ფინანსური სფეროსთვის.",
  },
  {
    id: "executive",
    name: "მენეჯერული",
    category: "formal",
    categoryLabel: "ფორმალური",
    description:
      "დახვეწილი სათაურები და მკაცრი სტრუქტურა სამართავი პოზიციებისთვის.",
  },
  {
    id: "modern",
    name: "თანამედროვე",
    category: "creative",
    categoryLabel: "შემოქმედებითი",
    description: "ფერადი სათაური და ჩიპები უნარებისთვის.",
  },
  {
    id: "bold",
    name: "გამორჩეული",
    category: "creative",
    categoryLabel: "შემოქმედებითი",
    description: "მსხვილი სახელი და აქცენტის ფერის ზოლი დიზაინერებისთვის.",
  },
  {
    id: "minimal",
    name: "მინიმალისტური",
    category: "simple",
    categoryLabel: "მარტივი",
    description: "სუფთა და მსუბუქი, ბევრი თავისუფალი სივრცით.",
  },
];

export const SAMPLE_CV = {
  firstName: "ნინო",
  lastName: "შარაშიძე",
  email: "nino@example.com",
  phone: "+995 555 12 34 56",
  summary:
    "მოტივირებული სპეციალისტი ვებ-განვითარების სფეროში, ახალი ტექნოლოგიების სწავლის დიდი სურვილით.",
  experience: [
    {
      position: "Junior Web Developer",
      company: "ტექ კომპანია",
      period: "2024 - 2026",
    },
  ],
  skills: ["HTML", "CSS", "JavaScript", "Git"],
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function placeholder(value, fallback) {
  return value
    ? { text: value, empty: false }
    : { text: fallback, empty: true };
}

// ხატავს რეზიუმეს მოცემულ კონტეინერში (textContent-ით, ამიტომ უსაფრთხოა)
export function renderResume(data, container) {
  const templateId = TEMPLATES.some((t) => t.id === data.template)
    ? data.template
    : "classic";
  const root = el("article", `resume resume--${templateId}`);

  const header = el("header", "resume__header");
  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
  const name = placeholder(fullName, "სახელი გვარი");
  const nameEl = el("h2", "resume__name", name.text);
  if (name.empty) nameEl.classList.add("is-placeholder");
  header.append(nameEl);

  const contacts = [data.email, data.phone].filter(Boolean).join("  |  ");
  const contact = placeholder(contacts, "ელფოსტა | ტელეფონი");
  const contactEl = el("p", "resume__contact", contact.text);
  if (contact.empty) contactEl.classList.add("is-placeholder");
  header.append(contactEl);
  root.append(header);

  if (data.summary) {
    const sec = el("section", "resume__section");
    sec.append(el("h3", "", "შეჯამება"), el("p", "", data.summary));
    root.append(sec);
  }

  const jobs = (data.experience || []).filter(
    (j) => j.position || j.company || j.period,
  );
  if (jobs.length > 0) {
    const sec = el("section", "resume__section");
    sec.append(el("h3", "", "გამოცდილება"));
    jobs.forEach((job) => {
      const item = el("div", "resume__item");
      item.append(el("strong", "", job.position || "—"));
      const meta = [job.company, job.period].filter(Boolean).join(", ");
      if (meta) item.append(el("span", "resume__meta", meta));
      sec.append(item);
    });
    root.append(sec);
  }

  if (data.skills && data.skills.length > 0) {
    const sec = el("section", "resume__section");
    sec.append(el("h3", "", "უნარები"));
    const list = el("ul", "resume__skills");
    data.skills.forEach((s) => list.append(el("li", "", s)));
    sec.append(list);
    root.append(sec);
  }

  container.replaceChildren(root);
}

// ---------- შაბლონების გვერდი: ძებნა, ფილტრი, გადახედვა ----------

function buildCard(template) {
  const card = el("article", "card");
  card.append(el("span", "badge", template.categoryLabel));
  card.append(el("h3", "", template.name));
  card.append(el("p", "", template.description));

  const actions = el("div", "card__actions");
  const previewBtn = el("button", "btn btn-outline", "გადახედვა");
  previewBtn.type = "button";
  previewBtn.addEventListener("click", () => openPreview(template));
  const useLink = el("a", "btn btn-primary", "გამოყენება");
  useLink.href = `editor.html?template=${encodeURIComponent(template.id)}`;
  actions.append(previewBtn, useLink);
  card.append(actions);
  return card;
}

function openPreview(template) {
  const holder = el("div", "modal-preview");
  renderResume({ ...SAMPLE_CV, template: template.id }, holder);
  openModal({
    title: `შაბლონი: ${template.name}`,
    body: holder,
    actions: [
      {
        label: "გამოყენება",
        variant: "btn-primary",
        href: `editor.html?template=${encodeURIComponent(template.id)}`,
      },
      { label: "დახურვა", variant: "btn-outline" },
    ],
  });
}

function initTemplatesPage() {
  const grid = document.getElementById("template-grid");
  if (!grid) return;
  const search = document.getElementById("template-search");
  const category = document.getElementById("template-category");
  const empty = document.getElementById("template-empty");

  function update() {
    const query = search.value.trim().toLowerCase();
    const selected = category.value;
    const filtered = TEMPLATES.filter((t) => {
      const matchesText =
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query);
      const matchesCategory = selected === "all" || t.category === selected;
      return matchesText && matchesCategory;
    });
    grid.replaceChildren(...filtered.map(buildCard));
    empty.hidden = filtered.length > 0;
  }

  search.addEventListener("input", update);
  category.addEventListener("change", update);
  update();
}

initTemplatesPage();
