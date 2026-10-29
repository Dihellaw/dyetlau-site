/* Dy&Lau — page d'accueil
   ============================================================
   RÉGLAGES À COMPLÉTER AVANT LA MISE EN LIGNE
   ============================================================ */

// Vidéo de fond du haut de page (fichier .mp4 dans le dépôt, ex. "Assets/Videos/hero.mp4").
// Tant qu'elle est vide, la photo de Dylan et Laura s'affiche avec un léger mouvement.
const HERO_VIDEO = "";

// Les 11 transformations. Pour chaque carte :
//   impact  : la phrase-choc de la transformation
//   name    : le nom du dirigeant
//   sector  : son secteur d'activité
//   youtube : l'identifiant ou le lien de la vidéo YouTube (ex. "https://youtu.be/XXXXXXXXXXX")
//   start   : (facultatif) la seconde de départ de la vidéo
// Un champ vide s'affiche comme « à compléter ».
const TRANSFORMATIONS = [
  { impact: "3 fois son chiffre d'affaires habituel d'une journée, en 45 minutes.", name: "Ali", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
  { impact: "", name: "", sector: "", youtube: "" },
];

// Le passage où Ali parle de sa journée signature (lien « Écouter Ali »).
const ALI_VIDEO = { youtube: "", start: 0 };

// La vidéo d'une vraie journée signature (30 s à 1 min 30).
const SIGNATURE_VIDEO = "";

// Lien de la playlist YouTube de la Masterclass Business.
const MASTERCLASS_URL = "";

// Adresse qui reçoit les candidatures (ex. un formulaire Formspree : "https://formspree.io/f/xxxxxxx").
// Tant qu'elle est vide, le formulaire ne prétend pas avoir envoyé quoi que ce soit.
const FORM_ENDPOINT = "";

// E-mail de contact affiché dans le pied de page.
const CONTACT_EMAIL = "";

/* ============================================================ */

document.documentElement.classList.add("js");

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function youtubeId(value) {
  if (!value) return "";
  const m = String(value).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(value) ? value : "";
}

function youtubeFrame(id, start, title) {
  const f = document.createElement("iframe");
  const t = start ? `&start=${Math.floor(start)}` : "";
  f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&cc_load_policy=1&hl=fr${t}`;
  f.title = title;
  f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  f.allowFullscreen = true;
  return f;
}

// Lecteur léger : la miniature d'abord, la vidéo seulement au clic.
function liteVideo(container, id, label, start = 0) {
  const img = document.createElement("img");
  img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  img.alt = "";
  img.loading = "lazy";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "card__play";
  btn.setAttribute("aria-label", `Lire la vidéo : ${label}`);
  btn.innerHTML = '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>Regarder</span>';
  btn.addEventListener("click", () => {
    container.replaceChildren(youtubeFrame(id, start, label));
  });
  container.append(img, btn);
}

/* ---------- Navigation ---------- */
const nav = $("#nav");
const burger = $("#burger");
const links = $("#nav-links");

function setMenu(open) {
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  links.classList.toggle("is-open", open);
  nav.classList.toggle("menu-open", open);
}
burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

const onScroll = () => nav.classList.toggle("is-solid", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Lien actif selon la section visible
const navTargets = $$(".nav__links a[href^='#']:not(.btn)")
  .map((a) => ({ a, el: $(a.getAttribute("href")) }))
  .filter((x) => x.el);
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    const hit = navTargets.find((x) => x.el === en.target);
    if (hit && en.isIntersecting) {
      navTargets.forEach((x) => x.a.removeAttribute("aria-current"));
      hit.a.setAttribute("aria-current", "true");
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
navTargets.forEach((x) => spy.observe(x.el));

/* ---------- Vidéo de fond ---------- */
if (HERO_VIDEO && !reduceMotion) {
  const v = document.createElement("video");
  Object.assign(v, { src: HERO_VIDEO, muted: true, loop: true, playsInline: true, autoplay: true });
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  v.poster = $(".hero__poster").currentSrc || $(".hero__poster").src;
  $(".hero__media").append(v);
  v.play().catch(() => {});
}

/* ---------- Les 11 transformations ---------- */
const list = $("#transfo-list");
TRANSFORMATIONS.forEach((t, i) => {
  const li = document.createElement("li");
  li.className = "card";
  const id = youtubeId(t.youtube);
  const who = t.name || "Dirigeant";
  li.innerHTML = `
    <div class="card__media"></div>
    <div class="card__body">
      <p class="card__impact"></p>
      <p class="card__who"><strong></strong><span></span></p>
    </div>`;
  const media = $(".card__media", li);
  if (id) {
    liteVideo(media, id, `la transformation de ${who}`, t.start || 0);
  } else {
    media.innerHTML = '<div class="card__soon"><p class="card__soon-mark" aria-hidden="true">Dy<b>&amp;</b><br>Lau</p><p>Vidéo bientôt en ligne</p></div>';
  }
  const impact = $(".card__impact", li);
  if (t.impact) impact.textContent = t.impact;
  else { impact.textContent = "Transformation à venir"; }
  const strong = $(".card__who strong", li);
  const span = $(".card__who span", li);
  if (t.name) strong.textContent = t.name;
  else { strong.textContent = "Nom du dirigeant"; strong.classList.add("todo"); }
  if (t.sector) span.textContent = t.sector;
  else { span.textContent = "Secteur à préciser"; span.classList.add("todo"); }
  if (i === 0) li.id = "transfo-ali";
  list.append(li);
});

// Défilement du carrousel
const rail = $("#rail");
const railBar = $("#rail-bar");
const prev = $("[data-rail='prev']");
const next = $("[data-rail='next']");
function railStep() {
  const card = $(".card", rail);
  return card ? card.getBoundingClientRect().width + 20 : 300;
}
function updateRail() {
  const max = rail.scrollWidth - rail.clientWidth;
  const ratio = rail.clientWidth / rail.scrollWidth;
  const pos = max > 0 ? rail.scrollLeft / max : 0;
  railBar.style.width = `${Math.max(ratio, 0.08) * 100 + pos * (1 - ratio) * 100}%`;
  prev.disabled = rail.scrollLeft < 8;
  next.disabled = rail.scrollLeft > max - 8;
}
prev.addEventListener("click", () => rail.scrollBy({ left: -railStep() * 2, behavior: reduceMotion ? "auto" : "smooth" }));
next.addEventListener("click", () => rail.scrollBy({ left: railStep() * 2, behavior: reduceMotion ? "auto" : "smooth" }));
rail.addEventListener("scroll", updateRail, { passive: true });
rail.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
  if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
});
window.addEventListener("resize", updateRail);
updateRail();

/* ---------- « Écouter Ali » ---------- */
const aliLink = $("#ecouter-ali");
const aliId = youtubeId(ALI_VIDEO.youtube);
if (aliId) {
  aliLink.href = `https://www.youtube.com/watch?v=${aliId}${ALI_VIDEO.start ? `&t=${ALI_VIDEO.start}s` : ""}`;
  aliLink.target = "_blank";
  aliLink.rel = "noopener";
} else {
  aliLink.href = "#transfo-ali";
  aliLink.addEventListener("click", () => setTimeout(() => {
    rail.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, 400));
}

/* ---------- Vidéo de la journée signature ---------- */
const sigSlot = $("#signature-video");
const sigId = youtubeId(SIGNATURE_VIDEO);
if (sigId) {
  liteVideo(sigSlot, sigId, "une journée signature en images");
} else {
  sigSlot.innerHTML = `
    <div class="video-slot__soon"><b>Une journée signature, en images</b><span>La vidéo arrive bientôt.</span></div>`;
}

/* ---------- Masterclass, contact ---------- */
if (MASTERCLASS_URL) $("#masterclass-link").href = MASTERCLASS_URL;
if (CONTACT_EMAIL) {
  const li = $("#footer-email");
  li.innerHTML = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
  li.hidden = false;
}
$("#year").textContent = new Date().getFullYear();

/* ---------- Ce que tu portes seul ---------- */
const charge = $("#charge");
const chargeOut = $("#charge-out");
function updateCharge() {
  const boxes = $$("input", charge);
  const on = boxes.filter((b) => b.checked);
  const dy = on.filter((b) => b.value === "dy").length;
  const lau = on.length - dy;
  if (!on.length) {
    chargeOut.textContent = "Rien coché ? Alors tu as déjà un bras droit. Sinon, coche ce que tu portes seul.";
    return;
  }
  const parts = [];
  if (dy) parts.push(`<b class="k-dy">Dylan</b> en reprend ${dy} avec toi`);
  if (lau) parts.push(`<b class="k-lau">Laura</b> en reprend ${lau} avec toi`);
  chargeOut.innerHTML = `Tu portes ${on.length} sujet${on.length > 1 ? "s" : ""} sur ${boxes.length}.<br>${parts.join(", ")}.`;
}
charge.addEventListener("change", updateCharge);
charge.addEventListener("submit", (e) => e.preventDefault());
updateCharge();

/* ---------- Chiffres animés ---------- */
const counters = $$("[data-count]");
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    countObs.unobserve(el);
    const end = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = end; return; }
    const dur = 1600;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = "0";
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
counters.forEach((c) => countObs.observe(c));

/* ---------- Apparitions au défilement ---------- */
$$(".section, .footer").forEach((sec) => {
  $$(".reveal", sec).forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 6) * 80}ms`));
});
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); revealObs.unobserve(en.target); }
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
$$(".reveal").forEach((el) => revealObs.observe(el));

/* ---------- Formulaire de candidature ---------- */
const form = $("#apply");
const steps = $$(".step", form);
const total = steps.length;
const btnPrev = $("#apply-prev");
const btnNext = $("#apply-next");
const btnSend = $("#apply-send");
const err = $("#apply-error");
const bar = $("#apply-bar");
const count = $("#apply-count");
const progress = $(".bar", form);
let current = 0;

function showStep(i, focus = true) {
  current = i;
  steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
  btnPrev.hidden = i === 0;
  btnNext.hidden = i === total - 1;
  btnSend.hidden = i !== total - 1;
  count.textContent = `Question ${i + 1} sur ${total}`;
  bar.style.width = `${((i + 1) / total) * 100}%`;
  progress.setAttribute("aria-valuenow", String(i + 1));
  err.textContent = "";
  if (focus) {
    const first = $("input, textarea", steps[i]);
    if (first) first.focus({ preventScroll: true });
  }
}

function stepValid(i) {
  const s = steps[i];
  const required = $$("[required]", s);
  for (const field of required) {
    if (field.type === "radio") {
      if (!$(`input[name="${field.name}"]:checked`, s)) return "Choisis une réponse pour continuer.";
    } else if (!field.value.trim()) {
      return "Ce champ est nécessaire pour continuer.";
    } else if (field.type === "tel" && field.value.replace(/\D/g, "").length < 8) {
      return "Ce numéro semble incomplet.";
    }
  }
  return "";
}

btnNext.addEventListener("click", () => {
  const msg = stepValid(current);
  if (msg) { err.textContent = msg; return; }
  showStep(current + 1);
});
btnPrev.addEventListener("click", () => showStep(current - 1));
// Entrée passe à la question suivante (sauf dans le champ libre)
form.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName === "INPUT" && current < total - 1) {
    e.preventDefault();
    btnNext.click();
  }
});
// Un choix dans une liste fait avancer tout seul, sauf à l'étape avec champ libre
$$(".step[data-step='2'] input[type='radio']", form).forEach((r) =>
  r.addEventListener("change", () => setTimeout(() => btnNext.click(), 220))
);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = stepValid(current);
  if (msg) { err.textContent = msg; return; }
  const data = Object.fromEntries(new FormData(form).entries());
  const done = $("#apply-done");
  const doneTitle = $("#apply-done-title");
  const doneText = $("#apply-done-text");

  if (!FORM_ENDPOINT) {
    err.textContent = "L'envoi n'est pas encore branché. Écris-nous sur Instagram (@dyetlau) en attendant.";
    return;
  }

  btnSend.disabled = true;
  btnSend.textContent = "Envoi…";
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    doneTitle.textContent = `Merci ${data.prenom} !`;
    doneText.textContent = "On a bien reçu ta demande. On revient vers toi très vite pour caler ton diagnostic.";
    form.classList.add("is-done");
    done.hidden = false;
    done.focus();
  } catch {
    err.textContent = "L'envoi n'a pas fonctionné. Réessaie, ou écris-nous sur Instagram (@dyetlau).";
    btnSend.disabled = false;
    btnSend.textContent = "Envoyer ma demande";
  }
});
showStep(0, false);

/* ---------- Fenêtres ---------- */
$$("[data-open]").forEach((b) => b.addEventListener("click", () => {
  const d = document.getElementById(b.dataset.open);
  if (d && d.showModal) d.showModal();
}));
$$("dialog").forEach((d) => {
  $("[data-close]", d).addEventListener("click", () => d.close());
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
});
