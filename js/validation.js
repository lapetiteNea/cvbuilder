// ფორმის კლიენტის მხარეს ვალიდაციის ფუნქციები
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validatePhone(phone) {
  // მარტივი რეგულარული გამოსახულება ტელეფონის ნომრისთვის
  const re = /^\+?[0-9\s\-\(\)]{9,15}$/;
  return re.test(String(phone));
}

export function validateContactForm() {
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");

  if (emailInput && emailInput.value && !validateEmail(emailInput.value)) {
    alert("გთხოვთ შეიყვანოთ ელფოსტის სწორი ფორმატი (მაგ: name@example.com)");
    return false;
  }

  if (phoneInput && phoneInput.value && !validatePhone(phoneInput.value)) {
    alert("გთხოვთ შეიყვანოთ ტელეფონის სწორი ნომერი");
    return false;
  }

  return true;
}
