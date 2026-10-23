const menu = document.querySelector("#menu");
menu?.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  document.querySelector("#navigation").classList.toggle("open", open);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    menu?.setAttribute("aria-expanded", "false");
    document.querySelector("#navigation")?.classList.remove("open");
  }
});

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!motionPreference.matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(
      ".section > h2, .section > .cards > .card, .help-list details, footer",
    )
    .forEach((node) => observer.observe(node));
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) observer.disconnect();
  });
}
