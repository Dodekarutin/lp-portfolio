const html = document.documentElement;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const deck = document.querySelector("[data-deck]");
const panels = Array.from(document.querySelectorAll("[data-panel]"));
const deckNav = document.querySelector("[data-deck-nav]");
const counterCurrent = document.querySelector("[data-counter-current]");
const counterTotal = document.querySelector("[data-counter-total]");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

const TRANSITION_MS = 1050;
const COOLDOWN_MS = 350;
const WHEEL_THRESHOLD = 12;
const SWIPE_THRESHOLD = 55;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const smallScreen = window.matchMedia("(max-width: 820px)");

let index = 0;
let locked = false;
let touchStartY = null;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const pad = (value) => String(value).padStart(2, "0");
const clampIndex = (value) => Math.max(0, Math.min(panels.length - 1, value));
const jackingEnabled = () => !reduceMotion.matches && !smallScreen.matches;

/* --------------------------------- deck chrome -------------------------------- */

const dots = panels.map((panel, i) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.dataset.label = panel.dataset.title || pad(i + 1);
  dot.setAttribute("aria-label", `${panel.dataset.title || ""} セクションへ移動`);
  dot.addEventListener("click", () => goTo(i));
  deckNav.appendChild(dot);
  return dot;
});

counterTotal.textContent = pad(panels.length);

const syncChrome = () => {
  panels.forEach((panel, i) => panel.classList.toggle("is-active", i === index));
  dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  counterCurrent.textContent = pad(index + 1);
  document.body.classList.toggle("theme-light", panels[index].dataset.theme === "light");
};

/* ------------------------------ section transition ---------------------------- */

const goTo = (target, instant = false) => {
  const next = clampIndex(target);
  if (!jackingEnabled()) {
    panels[next].scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
    return;
  }
  if (locked || next === index) {
    return;
  }

  index = next;
  locked = true;

  if (instant) {
    deck.style.transition = "none";
  }
  deck.style.transform = `translate3d(0, ${-index * 100}%, 0)`;
  if (instant) {
    void deck.offsetHeight;
    deck.style.transition = "";
  }

  syncChrome();
  const id = panels[index].id;
  history.replaceState(null, "", `#${id}`);

  window.setTimeout(() => {
    locked = false;
  }, (instant ? 0 : TRANSITION_MS) + COOLDOWN_MS);
};

/* ---------------------------------- 入力の乗っ取り ----------------------------- */

window.addEventListener(
  "wheel",
  (event) => {
    if (!jackingEnabled()) {
      return;
    }
    event.preventDefault();
    if (locked || Math.abs(event.deltaY) < WHEEL_THRESHOLD) {
      return;
    }
    goTo(index + Math.sign(event.deltaY));
  },
  { passive: false }
);

window.addEventListener(
  "touchstart",
  (event) => {
    touchStartY = event.touches[0].clientY;
  },
  { passive: true }
);

window.addEventListener(
  "touchmove",
  (event) => {
    if (jackingEnabled()) {
      event.preventDefault();
    }
  },
  { passive: false }
);

window.addEventListener("touchend", (event) => {
  if (!jackingEnabled() || touchStartY === null) {
    return;
  }
  const delta = touchStartY - event.changedTouches[0].clientY;
  touchStartY = null;
  if (Math.abs(delta) >= SWIPE_THRESHOLD) {
    goTo(index + Math.sign(delta));
  }
});

window.addEventListener("keydown", (event) => {
  if (!jackingEnabled()) {
    return;
  }
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return;
  }
  switch (event.key) {
    case "ArrowDown":
    case "PageDown":
    case " ":
      event.preventDefault();
      goTo(index + 1);
      break;
    case "ArrowUp":
    case "PageUp":
      event.preventDefault();
      goTo(index - 1);
      break;
    case "Home":
      event.preventDefault();
      goTo(0);
      break;
    case "End":
      event.preventDefault();
      goTo(panels.length - 1);
      break;
  }
});

/* ------------------------------- anchor navigation ----------------------------- */

document.addEventListener("click", (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) {
    return;
  }
  const target = panels.findIndex((panel) => `#${panel.id}` === anchor.getAttribute("href"));
  if (target === -1) {
    return;
  }
  event.preventDefault();
  goTo(target);
  nav.classList.remove("is-open");
  navToggle.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
});

/* ------------------------------ mode enable / disable -------------------------- */

const syncMode = () => {
  if (jackingEnabled()) {
    html.classList.add("is-jacked");
    window.scrollTo(0, 0);
    deck.style.transition = "none";
    deck.style.transform = `translate3d(0, ${-index * 100}%, 0)`;
    void deck.offsetHeight;
    deck.style.transition = "";
    syncChrome();
  } else {
    html.classList.remove("is-jacked");
    deck.style.transform = "";
  }
};

reduceMotion.addEventListener("change", syncMode);
smallScreen.addEventListener("change", syncMode);

/* フォールバック時は IntersectionObserver で演出を発火 */
const observer = new IntersectionObserver(
  (entries) => {
    if (jackingEnabled()) {
      return;
    }
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
    });
  },
  { threshold: 0.2 }
);

panels.forEach((panel) => observer.observe(panel));

/* フォールバック時のみヘッダーの背景を出す */
const syncHeader = () => {
  if (html.classList.contains("is-jacked")) {
    header.classList.remove("is-scrolled");
    return;
  }
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

window.addEventListener("scroll", syncHeader, { passive: true });

/* --------------------------------- misc UI ------------------------------------ */

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  formStatus.textContent = `${name || "お客さま"}、お問い合わせありがとうございます。送信デモを完了しました。`;
  form.reset();
});

/* ----------------------------------- boot ------------------------------------- */

const initialTarget = panels.findIndex((panel) => `#${panel.id}` === location.hash);
if (initialTarget > 0) {
  index = initialTarget;
}

syncMode();
syncHeader();
if (!jackingEnabled() && initialTarget > 0) {
  panels[initialTarget].scrollIntoView();
}
