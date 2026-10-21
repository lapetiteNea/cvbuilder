const labels = {
  experience: "გამოცდილება",
  education: "განათლება",
  skills: "უნარები",
};
export function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function renderResume(target, data) {
  target.replaceChildren();
  target.className = `resume ${data.template}`;
  target.style.setProperty("--cv-accent", data.color);
  target.append(
    element("h2", data.name || "შენი სახელი და გვარი"),
    element("p", data.title || "შენი პროფესია", "job-title"),
    element(
      "p",
      [data.email, data.phone, data.city].filter(Boolean).join(" · "),
      "contact-line",
    ),
  );
  if (data.summary)
    target.append(element("h3", "ჩემ შესახებ"), element("p", data.summary));
  for (const type of data.order) {
    const entries = data[type].filter((x) => x.title.trim() || x.detail.trim());
    if (!entries.length) continue;
    const section = element("section");
    section.append(element("h3", labels[type]));
    for (const item of entries) {
      const block = element("div", undefined, "item");
      block.append(element("strong", item.title));
      if (item.detail) block.append(element("p", item.detail));
      section.append(block);
    }
    target.append(section);
  }
}
