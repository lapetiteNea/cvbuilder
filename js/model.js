export const templates = ["modern", "classic", "minimal"];
export function emptyResume() {
  return {
    id: "",
    name: "",
    title: "",
    email: "",
    phone: "",
    city: "",
    label: "",
    summary: "",
    template: "modern",
    color: "#315a4b",
    order: ["experience", "education", "skills"],
    experience: [],
    education: [],
    skills: [],
  };
}
export function validate(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = "შეიყვანე სახელი და გვარი.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "შეიყვანე სწორი ელფოსტა, მაგალითად name@example.com.";
  if (
    !/^\+?[\d\s()-]+$/.test(data.phone) ||
    !/^\d{9,15}$/.test(data.phone.replace(/\D/g, ""))
  )
    errors.phone = "შეიყვანე 9–15 ციფრისგან შემდგარი ტელეფონი.";
  return errors;
}
export function moveSection(order, index, direction) {
  const next = [...order],
    target = index + direction;
  if (target >= 0 && target < next.length)
    [next[index], next[target]] = [next[target], next[index]];
  return next;
}
export function normalize(value) {
  const data = emptyResume();
  if (!value || typeof value !== "object") return data;
  for (const key of [
    "id",
    "name",
    "title",
    "email",
    "phone",
    "city",
    "label",
    "summary",
  ])
    data[key] = typeof value[key] === "string" ? value[key] : "";
  data.template = templates.includes(value.template)
    ? value.template
    : "modern";
  data.color = /^#[0-9a-f]{6}$/i.test(value.color) ? value.color : data.color;
  if (
    Array.isArray(value.order) &&
    value.order.length === 3 &&
    new Set(value.order).size === 3 &&
    value.order.every((x) => data.order.includes(x))
  )
    data.order = [...value.order];
  for (const type of ["experience", "education", "skills"])
    data[type] = Array.isArray(value[type])
      ? value[type]
          .filter((x) => x && typeof x === "object")
          .map((x) => ({
            title: String(x.title || ""),
            detail: String(x.detail || ""),
          }))
      : [];
  return data;
}
