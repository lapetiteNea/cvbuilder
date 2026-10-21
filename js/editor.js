// რედაქტორი: ფორმა, რეალურ დროში პრევიუ, დინამიური ველები, შენახვა

import { TEMPLATES, renderResume } from "./templates.js";
import {
  attachLiveValidation,
  validateForm,
  showError,
  clearError,
} from "./validation.js";
import { getById, saveCv } from "./storage.js";
import { openModal } from "./modal.js";

const MAX_SKILLS = 12;
const form = document.getElementById("cv-form");

function init() {
  const preview = document.getElementById("resume-preview");
  const expList = document.getElementById("experience-list");
  const skillsList = document.getElementById("skills-list");
  const skillInput = document.getElementById("skill-input");
  const templateSelect = document.getElementById("template");
  const summary = document.getElementById("summary");
  const counter = document.getElementById("summary-counter");

  const state = { id: null, skills: [] };
  let expCounter = 0;

  // შაბლონების dropdown
  TEMPLATES.forEach((t) => {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.name;
    templateSelect.append(option);
  });

  // ---------- მონაცემების აკრეფა ფორმიდან ----------
  function collect() {
    const experience = [...expList.querySelectorAll(".exp-item")].map(
      (item) => ({
        position: item.querySelector('[data-field="position"]').value.trim(),
        company: item.querySelector('[data-field="company"]').value.trim(),
        period: item.querySelector('[data-field="period"]').value.trim(),
      }),
    );
    return {
      id: state.id,
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      summary: form.summary.value.trim(),
      template: templateSelect.value,
      experience,
      skills: [...state.skills],
    };
  }

  function refresh() {
    renderResume(collect(), preview);
    counter.textContent = `${summary.value.length}/${summary.maxLength}`;
  }

  // ---------- გამოცდილების დინამიური ველები ----------
  function addExperience(values = {}) {
    expCounter += 1;
    const n = expCounter;
    const item = document.createElement("div");
    item.className = "exp-item";

    [
      ["position", "თანამდებობა"],
      ["company", "კომპანია"],
      ["period", "პერიოდი (მაგ. 2023 - 2025)"],
    ].forEach(([field, label]) => {
      const group = document.createElement("div");
      group.className = "form-group";
      const lab = document.createElement("label");
      lab.htmlFor = `exp-${field}-${n}`;
      lab.textContent = label;
      const input = document.createElement("input");
      input.type = "text";
      input.id = `exp-${field}-${n}`;
      input.dataset.field = field;
      input.value = values[field] || "";
      group.append(lab, input);
      item.append(group);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-danger exp-item__remove";
    remove.textContent = "წაშლა";
    remove.addEventListener("click", () => {
      item.remove();
      refresh();
    });
    item.append(remove);
    expList.append(item);
  }

  document.getElementById("add-experience").addEventListener("click", () => {
    addExperience();
    refresh();
    expList.lastElementChild.querySelector("input").focus();
  });

  // ---------- უნარების ჩიპები ----------
  function renderSkills() {
    skillsList.replaceChildren(
      ...state.skills.map((skill, index) => {
        const li = document.createElement("li");
        li.className = "chip";
        li.append(document.createTextNode(skill));
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `უნარის წაშლა: ${skill}`);
        btn.textContent = "×";
        btn.addEventListener("click", () => {
          state.skills.splice(index, 1);
          renderSkills();
          refresh();
        });
        li.append(btn);
        return li;
      }),
    );
  }

  function addSkill() {
    const value = skillInput.value.trim();
    clearError(skillInput);
    if (!value) return showError(skillInput, "ჩაწერეთ უნარი დასამატებლად");
    if (state.skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      return showError(skillInput, "ეს უნარი უკვე დამატებულია");
    }
    if (state.skills.length >= MAX_SKILLS) {
      return showError(
        skillInput,
        `მაქსიმუმ ${MAX_SKILLS} უნარის დამატება შეიძლება`,
      );
    }
    state.skills.push(value);
    skillInput.value = "";
    renderSkills();
    refresh();
  }

  document.getElementById("add-skill").addEventListener("click", addSkill);
  skillInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // ფორმის გაგზავნის თავიდან აცილება
      addSkill();
    }
  });

  // ---------- არსებული რეზიუმის ან შაბლონის ჩატვირთვა ----------
  const params = new URLSearchParams(window.location.search);
  const saved = params.get("id") ? getById(params.get("id")) : null;
  if (saved) {
    state.id = saved.id;
    ["firstName", "lastName", "email", "phone", "summary"].forEach((k) => {
      form[k].value = saved[k] || "";
    });
    templateSelect.value = TEMPLATES.some((t) => t.id === saved.template)
      ? saved.template
      : TEMPLATES[0].id;
    (saved.experience || []).forEach(addExperience);
    state.skills = [...(saved.skills || [])];
    renderSkills();
  } else {
    const wanted = params.get("template");
    templateSelect.value = TEMPLATES.some((t) => t.id === wanted)
      ? wanted
      : TEMPLATES[0].id;
    addExperience();
  }

  // ---------- ივენთები ----------
  attachLiveValidation(form);
  form.addEventListener("input", refresh);
  templateSelect.addEventListener("change", refresh);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const result = saveCv(collect());
    if (!result) {
      openModal({
        title: "შენახვა ვერ მოხერხდა",
        body: "ბრაუზერის მეხსიერებაზე წვდომა ვერ მოხერხდა. სცადეთ ხელახლა.",
        actions: [{ label: "კარგი", variant: "btn-primary" }],
      });
      return;
    }
    state.id = result.id;
    openModal({
      title: "რეზიუმე შენახულია",
      body: "შენი რეზიუმე წარმატებით შეინახა.",
      actions: [
        {
          label: "ჩემი რეზიუმეები",
          variant: "btn-primary",
          href: "my-cvs.html",
        },
        { label: "რედაქტირების გაგრძელება", variant: "btn-outline" },
      ],
    });
  });

  document
    .getElementById("print-btn")
    .addEventListener("click", () => window.print());

  refresh();
}

if (form) init();
