// ფორმის კლიენტის მხარის ვალიდაცია

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS_RE = /^[+\d\s()-]+$/;
const NAME_RE = /^[\p{L}\s'-]+$/u;

// აბრუნებს შეცდომის ტექსტს, ან ცარიელ სტრიქონს თუ ველი სწორია
export function getError(field) {
  const value = field.value.trim();

  if (field.required && !value) return "ეს ველი სავალდებულოა";
  if (!value) return "";

  switch (field.dataset.validate) {
    case "email":
      if (!EMAIL_RE.test(value))
        return "შეიყვანეთ სწორი ელფოსტა, მაგ. name@example.com";
      break;
    case "phone": {
      const digits = value.replace(/\D/g, "");
      if (
        !PHONE_CHARS_RE.test(value) ||
        digits.length < 9 ||
        digits.length > 15
      ) {
        return "შეიყვანეთ სწორი ტელეფონის ნომერი, მაგ. 555 12 34 56";
      }
      break;
    }
    case "name":
      if (!NAME_RE.test(value)) return "ველი მხოლოდ ასოებს უნდა შეიცავდეს";
      break;
  }

  if (field.minLength > 0 && value.length < field.minLength) {
    return `მინიმუმ ${field.minLength} სიმბოლო (ახლა: ${value.length})`;
  }
  return "";
}

export function showError(field, message) {
  const id = `${field.id}-error`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("p");
    el.id = id;
    el.className = "field-error";
    el.setAttribute("role", "alert");
    field.insertAdjacentElement("afterend", el);
  }
  el.textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", id);
}

export function clearError(field) {
  const el = document.getElementById(`${field.id}-error`);
  if (el) el.remove();
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
}

export function validateField(field) {
  const message = getError(field);
  if (message) showError(field, message);
  else clearError(field);
  return message === "";
}

function validatedFields(form) {
  return [...form.querySelectorAll("input, textarea, select")].filter(
    (f) => f.required || f.dataset.validate || f.minLength > 0,
  );
}

// ამოწმებს მთელ ფორმას; პირველ არასწორ ველზე გადააქვს ფოკუსი
export function validateForm(form) {
  const fields = validatedFields(form);
  const results = fields.map((f) => ({ field: f, ok: validateField(f) }));
  const firstBad = results.find((r) => !r.ok);
  if (firstBad) firstBad.field.focus();
  return !firstBad;
}

export function clearFormErrors(form) {
  validatedFields(form).forEach(clearError);
}

// ველის დატოვებისას ამოწმებს; შეცდომის გასწორებისას ადგილზევე იხსნება
export function attachLiveValidation(form) {
  form.addEventListener("focusout", (e) => {
    if (validatedFields(form).includes(e.target)) validateField(e.target);
  });
  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true")
      validateField(e.target);
  });
}
