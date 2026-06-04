const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const reveals = document.querySelectorAll(".reveal");
const accordion = document.querySelector("[data-accordion]");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (location.hash === "#top") {
  window.scrollTo(0, 0);
}

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

reveals.forEach((element) => observer.observe(element));

accordion.querySelector("button").addEventListener("click", () => {
  const isOpen = accordion.classList.toggle("is-open");
  accordion.querySelector("button").setAttribute("aria-expanded", String(isOpen));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  formStatus.textContent = `${name || "お客さま"}、お問い合わせありがとうございます。送信デモを完了しました。`;
  form.reset();
});
