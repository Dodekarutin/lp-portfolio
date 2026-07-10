const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const scenes = Array.from(document.querySelectorAll("[data-scene]"));
const parallaxes = Array.from(document.querySelectorAll("[data-parallax]"));
const anims = Array.from(document.querySelectorAll(".anim"));
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

/* ------------------------- スクロール連動アニメーション ------------------------- */
/* ピン留めシーンは通過率(--p: 0→1)、パララックス帯はずれ量(--shift)を毎フレーム更新 */

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const updateScroll = () => {
  const viewportH = window.innerHeight;

  scenes.forEach((scene) => {
    const rect = scene.getBoundingClientRect();
    const travel = rect.height - viewportH;
    if (travel <= 0) {
      scene.style.setProperty("--p", "0");
      return;
    }
    scene.style.setProperty("--p", clamp01(-rect.top / travel).toFixed(4));
  });

  parallaxes.forEach((band) => {
    const rect = band.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewportH) {
      return;
    }
    const factor = parseFloat(band.dataset.parallax) || 0.12;
    const offset = (rect.top + rect.height / 2 - viewportH / 2) * -factor;
    band.style.setProperty("--shift", `${offset.toFixed(1)}px`);
  });
};

let ticking = false;

const requestUpdate = () => {
  if (reduceMotion.matches || ticking) {
    return;
  }
  ticking = true;
  window.requestAnimationFrame(() => {
    updateScroll();
    ticking = false;
  });
};

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
window.addEventListener("load", requestUpdate);

/* ------------------------------ フェードアップ演出 ------------------------------ */

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -40px" }
);

anims.forEach((element) => observer.observe(element));

/* ---------------------------------- header ------------------------------------ */

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > window.innerHeight * 0.5);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

/* --------------------------------- mobile nav ---------------------------------- */

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

/* ----------------------------------- form ------------------------------------- */

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  formStatus.textContent = `${name || "お客さま"}、お問い合わせありがとうございます。送信デモを完了しました。`;
  form.reset();
});

/* ----------------------------------- boot ------------------------------------- */

updateScroll();
