document.addEventListener("DOMContentLoaded", () => {
  // ფორმის ველებისა და პრევიუს ელემენტების დაკავშირება
  const nameInput = document.getElementById("fullName");
  const previewName = document.getElementById("previewName");

  if (nameInput && previewName) {
    nameInput.addEventListener("input", (e) => {
      previewName.textContent = e.target.value || "თქვენი სახელი და გვარი";
    });
  }

  const titleInput = document.getElementById("jobTitle");
  const previewTitle = document.getElementById("previewTitle");

  if (titleInput && previewTitle) {
    titleInput.addEventListener("input", (e) => {
      previewTitle.textContent = e.target.value || "სასურველი პოზიცია";
    });
  }

  const emailInput = document.getElementById("email");
  const previewEmail = document.getElementById("previewEmail");

  if (emailInput && previewEmail) {
    emailInput.addEventListener("input", (e) => {
      previewEmail.textContent = e.target.value || "email@example.com";
    });
  }

  const phoneInput = document.getElementById("phone");
  const previewPhone = document.getElementById("previewPhone");

  if (phoneInput && previewPhone) {
    phoneInput.addEventListener("input", (e) => {
      previewPhone.textContent = e.target.value || "+995 500 00 00 00";
    });
  }
});
