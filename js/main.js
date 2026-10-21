// საერთო ლოგიკა: მობილური მენიუ, აკორდეონი, კონტაქტის ფორმა

import {
  attachLiveValidation,
  validateForm,
  clearFormErrors,
} from "./validation.js";
import { openModal } from "./modal.js";

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () =>
    setOpen(!nav.classList.contains("is-open")),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

// აკორდეონი: ერთდროულად მხოლოდ ერთი პუნქტი რჩება ღია
function initAccordion() {
  const items = document.querySelectorAll(".accordion details");
  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  attachLiveValidation(form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    form.reset();
    clearFormErrors(form);
    openModal({
      title: "მადლობა!",
      body: "შენი შეტყობინება მიღებულია. მალე დაგიკავშირდებით.",
      actions: [{ label: "კარგი", variant: "btn-primary" }],
    });
  });
}

initNavToggle();
initAccordion();
initContactForm();
