/* Dy&Lau — page d'accueil
   ============================================================
   Les textes, les 11 transformations et les liens (vidéos, Masterclass,
   formulaire, e-mail) sont dans textes.json. On les modifie depuis le mode
   édition de l'aperçu, ou directement dans ce fichier.
   Les valeurs ci-dessous ne servent que si textes.json ne se charge pas.
   ============================================================ */

/* ---------- Vidéos de « Ta journée signature » ----------
   Colle ici les liens YouTube (youtube.com ou youtu.be). Laisse vide pour afficher
   un emplacement provisoire. Un lien saisi dans le mode édition (« Liens et vidéos »)
   passe avant ces valeurs. */
const ALI_VIDEO_URL = "";        // le témoignage d'Ali
const ALI_VIDEO_START = 0;       // la seconde où Ali parle de sa journée signature (ex. 95 pour 1 min 35)
const SIGNATURE_VIDEO_URL = "";  // une journée signature en images

const DEFAULTS = {
  textes: {},
  cartes: [
    { impact: "3 fois son chiffre d'affaires habituel d'une journée, en 45 minutes.", nom: "Ali", secteur: "", youtube: "" },
    ...Array.from({ length: 10 }, () => ({ impact: "", nom: "", secteur: "", youtube: "" })),
  ],
  reglages: {
    videoFond: "",
    videoAli: ALI_VIDEO_URL,
    videoAliSeconde: ALI_VIDEO_START,
    videoJourneeSignature: SIGNATURE_VIDEO_URL,
    lienMasterclass: "",
    adresseFormulaire: "",
    emailContact: "",
  },
};

document.documentElement.classList.add("js", "textes-en-attente");

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SITE = { textes: {}, cartes: [], reglages: {} };

/* ---------- Textes ---------- */

// Garde seulement la mise en forme simple : gras, italique, retour à la ligne, exposant, lien.
function cleanHTML(html) {
  const t = document.createElement("template");
  t.innerHTML = String(html ?? "");
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === Node.COMMENT_NODE) { n.remove(); return; }
      if (n.nodeType !== Node.ELEMENT_NODE) return;
      walk(n);
      const tag = n.tagName.toLowerCase();
      if (["strong", "b", "em", "i", "br", "sup"].includes(tag)) {
        [...n.attributes].forEach((a) => n.removeAttribute(a.name));
      } else if (tag === "a") {
        const href = n.getAttribute("href") || "";
        [...n.attributes].forEach((a) => n.removeAttribute(a.name));
        if (/^(https?:|#|mailto:)/i.test(href)) {
          n.setAttribute("href", href);
          if (/^https?:/i.test(href)) { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener"); }
        }
      } else {
        n.replaceWith(...n.childNodes);
      }
    });
  };
  walk(t.content);
  return t.innerHTML.trim();
}

function applyTexts(textes) {
  Object.entries(textes || {}).forEach(([k, html]) => {
    const el = document.querySelector(`[data-k="${CSS.escape(k)}"]`);
    if (el && typeof html === "string") el.innerHTML = cleanHTML(html);
  });
  // Un texte vidé dans l'éditeur ne laisse pas de trou sur la page (il reste visible en mode édition)
  $$("[data-k]").forEach((el) => {
    el.toggleAttribute("data-vide", !el.textContent.replace(/\u00a0/g, " ").trim());
  });
}

async function loadSite() {
  try {
    const res = await fetch("textes.json", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const d = await res.json();
    return {
      textes: d.textes && typeof d.textes === "object" ? d.textes : {},
      cartes: Array.isArray(d.cartes) && d.cartes.length ? d.cartes : DEFAULTS.cartes,
      // Une valeur vide dans textes.json ne remplace pas celle définie dans ce fichier
      reglages: { ...DEFAULTS.reglages, ...Object.fromEntries(Object.entries(d.reglages || {}).filter(([, v]) => v !== "" && v !== 0 && v != null)) },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

/* ---------- Vidéos YouTube ---------- */

function youtubeId(value) {
  if (!value) return "";
  const m = String(value).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(String(value).trim()) ? String(value).trim() : "";
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
// Là où YouTube ne peut pas s'afficher dans la page (l'aperçu claude.ai), le lien ouvre YouTube.
function liteVideo(container, id, label, start = 0) {
  const img = document.createElement("img");
  img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  img.alt = "";
  img.loading = "lazy";
  img.addEventListener("error", () => img.remove());
  const play = document.createElement("a");
  play.className = "card__play";
  play.href = `https://www.youtube.com/watch?v=${id}${start ? `&t=${Math.floor(start)}s` : ""}`;
  play.target = "_blank";
  play.rel = "noopener";
  play.setAttribute("aria-label", `Lire la vidéo : ${label}`);
  play.innerHTML = '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>Regarder</span>';
  play.addEventListener("click", (e) => {
    if (window.claude || document.documentElement.classList.contains("edition")) return;
    e.preventDefault();
    container.replaceChildren(youtubeFrame(id, start, label));
  });
  container.replaceChildren(img, play);
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

/* ---------- Les transformations : carrousel en boucle ----------
   Les cartes sont dupliquées avant et après la série d'origine. Quand le défilement
   s'arrête sur un double, on se recale sans animation sur la carte d'origine identique. */
const list = $("#transfo-list");
const rail = $("#rail");
const carousel = $("#carousel");
const prev = $("[data-rail='prev']");
const next = $("[data-rail='next']");
const CARD_PLACEHOLDERS = { impact: "Transformation à venir", nom: "Prénom à venir", secteur: "Secteur à préciser" };
let cardCount = 0;

function makeCard(t, i, clone) {
  const li = document.createElement("li");
  li.className = "card";
  li.dataset.card = String(i);
  const id = youtubeId(t.youtube);
  li.innerHTML = `
    <div class="card__media"></div>
    <div class="card__body">
      <p class="card__label" data-field="secteur"></p>
      <h3 class="card__impact" data-field="impact"></h3>
      <p class="card__who" data-field="nom"></p>
    </div>`;
  const media = $(".card__media", li);
  if (id) {
    liteVideo(media, id, `la transformation de ${t.nom || "ce client"}`, Number(t.debut) || 0);
  } else {
    media.innerHTML = '<div class="card__soon"><p class="card__soon-mark" aria-hidden="true">Dy<b>&amp;</b><br>Lau</p><p>Vidéo bientôt en ligne</p></div>';
  }
  $$("[data-field]", li).forEach((el) => {
    const f = el.dataset.field;
    el.textContent = t[f] || CARD_PLACEHOLDERS[f];
    el.classList.toggle("todo", !t[f]);
  });
  if (clone) {
    // Les doubles servent seulement à la boucle : invisibles pour le clavier et les lecteurs d'écran
    li.dataset.clone = "";
    li.setAttribute("aria-hidden", "true");
    li.inert = true;
  } else if (i === 0) {
    li.id = "transfo-ali";
  }
  return li;
}

const allCards = () => $$(".card", list);
const visibleCards = () => allCards().filter((c) => c.offsetParent !== null);
const centerOf = (card) => card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;

function nearestCard() {
  const mid = rail.scrollLeft + rail.clientWidth / 2;
  let best = null;
  let dist = Infinity;
  visibleCards().forEach((c) => {
    const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
    if (d < dist) { dist = d; best = c; }
  });
  return best;
}

function setActive(card) {
  allCards().forEach((c) => c.classList.toggle("is-active", c === card));
}

function goTo(card, behavior = reduceMotion ? "auto" : "smooth") {
  if (card) rail.scrollTo({ left: centerOf(card), behavior });
}

function step(dir) {
  const cards = visibleCards();
  const i = cards.indexOf(nearestCard());
  goTo(cards[Math.min(cards.length - 1, Math.max(0, i + dir))]);
}

// Recalage discret : du double vers la carte d'origine identique, sans animation
function normalize() {
  if (dragging || root.classList.contains("edition") || !cardCount) return;
  const cards = allCards();
  const i = cards.indexOf(nearestCard());
  if (i < 0) return;
  let j = i;
  if (i < cardCount) j = i + cardCount;
  else if (i >= 2 * cardCount) j = i - cardCount;
  if (j === i) return;
  list.classList.add("no-anim");
  setActive(cards[j]);
  rail.style.scrollSnapType = "none";
  const ri = cards[i].getBoundingClientRect();
  const rj = cards[j].getBoundingClientRect();
  rail.scrollLeft += (rj.left + rj.width / 2) - (ri.left + ri.width / 2);
  void rail.offsetWidth;
  rail.style.scrollSnapType = "";
  requestAnimationFrame(() => requestAnimationFrame(() => list.classList.remove("no-anim")));
}

function renderCards(cartes) {
  cardCount = cartes.length;
  const frag = document.createDocumentFragment();
  cartes.forEach((t, i) => frag.append(makeCard(t, i, true)));
  cartes.forEach((t, i) => frag.append(makeCard(t, i, false)));
  cartes.forEach((t, i) => frag.append(makeCard(t, i, true)));
  list.replaceChildren(frag);
  allCards().forEach((c) => activeObs.observe(c));
  // On démarre sur la première carte d'origine, au centre
  requestAnimationFrame(() => {
    const first = allCards()[cardCount];
    list.classList.add("no-anim");
    setActive(first);
    goTo(first, "auto");
    requestAnimationFrame(() => requestAnimationFrame(() => list.classList.remove("no-anim")));
  });
}

// Carte active : celle qui croise la ligne verticale au milieu du carrousel
const activeObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) setActive(en.target); });
}, { root: rail, rootMargin: "0px -50% 0px -50%", threshold: 0 });
carousel.classList.add("is-live");

let scrollTimer;
rail.addEventListener("scroll", () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(normalize, 140);
}, { passive: true });

prev.addEventListener("click", () => step(-1));
next.addEventListener("click", () => step(1));
rail.addEventListener("keydown", (e) => {
  if (e.target !== rail) return;
  if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
});

// Glisser à la souris (le doigt et le pavé tactile défilent nativement)
let dragging = false;
let dragMoved = false;
let dragX = 0;
let dragStart = 0;
rail.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" || e.button !== 0 || root.classList.contains("edition")) return;
  dragging = true;
  dragMoved = false;
  dragX = e.clientX;
  dragStart = rail.scrollLeft;
});
window.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - dragX;
  if (!dragMoved && Math.abs(dx) > 5) { dragMoved = true; rail.classList.add("is-dragging"); }
  if (dragMoved) rail.scrollLeft = dragStart - dx;
});
window.addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = false;
  if (!dragMoved) return;
  rail.classList.remove("is-dragging");
  goTo(nearestCard());
});
// Un glisser ne doit pas ouvrir la vidéo sous le curseur
rail.addEventListener("click", (e) => {
  if (dragMoved) { e.preventDefault(); e.stopPropagation(); dragMoved = false; }
}, true);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => goTo(nearestCard(), "auto"), 150);
});

/* ---------- Réglages : vidéos, liens, contact ---------- */
const VIDEO_PLACEHOLDER = '<div class="sig-placeholder"><span class="sig-placeholder__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span><p>Vidéo bientôt en ligne</p></div>';

function applySettings(r) {
  // Vidéo de fond : version légère sur téléphone, rien si « réduire les animations » ou économie de données
  const v = $(".hero__video");
  const small = window.matchMedia("(max-width: 760px)").matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const src = r.videoFond || (small ? v.dataset.srcMobile : v.dataset.src);
  if (src && !reduceMotion && !saveData) {
    if (v.getAttribute("src") !== src) {
      v.classList.remove("is-playing");
      v.muted = true;
      v.src = src;
    }
    v.addEventListener("playing", () => v.classList.add("is-playing"), { once: true });
    v.play().catch(() => {});
  } else {
    v.removeAttribute("src");
    v.classList.remove("is-playing");
  }

  // Ta journée signature : témoignage d'Ali (au bon moment) et vidéo d'une journée
  const aliSlot = $("#ali-video");
  const aliId = youtubeId(r.videoAli);
  if (aliId) liteVideo(aliSlot, aliId, "le témoignage d'Ali sur sa journée signature", Number(r.videoAliSeconde) || 0);
  else aliSlot.innerHTML = VIDEO_PLACEHOLDER;

  const sigSlot = $("#signature-video");
  const sigId = youtubeId(r.videoJourneeSignature);
  if (sigId) liteVideo(sigSlot, sigId, "une journée signature en images");
  else sigSlot.innerHTML = VIDEO_PLACEHOLDER;

  // Masterclass
  $("#masterclass-link").href = r.lienMasterclass || "https://www.instagram.com/dyetlau/";

  // E-mail de contact
  const li = $("#footer-email");
  li.replaceChildren();
  if (r.emailContact) {
    const a = document.createElement("a");
    a.href = `mailto:${r.emailContact}`;
    a.textContent = r.emailContact;
    li.append(a);
  }
  li.hidden = !r.emailContact;
}
$("#year").textContent = new Date().getFullYear();

/* ---------- Ce que tu portes seul ---------- */
const charge = $("#charge");
const chargeOut = $("#charge-out");
const chargeCta = $("#charge-cta");
const NBSP = "\u00a0";

function chargeLines() {
  const boxes = $$("input[type='checkbox']", charge);
  const on = boxes.filter((b) => b.checked);
  if (!on.length) return [{ text: `Rien coché${NBSP}? Alors tu as déjà un bras droit. Sinon, coche ce que tu portes seul.` }];
  const label = (b) => b.nextElementSibling.textContent.replace(/\s+/g, " ").trim().toLowerCase();
  const dy = on.filter((b) => b.value === "dy").map(label);
  const lau = on.filter((b) => b.value === "lau").map(label);
  const n = on.length;
  const lines = [{ text: `Tu portes seul ${n} chose${n > 1 ? "s" : ""} sur ${boxes.length}.`, strong: true }];
  if (dy.length) lines.push({ who: "Dylan", text: ` peut prendre${NBSP}: ${dy.join(", ")}.` });
  if (lau.length) lines.push({ who: "Laura", text: ` peut prendre${NBSP}: ${lau.join(", ")}.` });
  if (n >= 5) lines.push({ text: "Tu fais vraiment tout. C'est exactement pour ça qu'on existe.", cls: "charge__all" });
  return lines;
}

function renderCharge() {
  const lines = chargeLines();
  chargeOut.replaceChildren(...lines.map((l) => {
    const p = document.createElement("p");
    if (l.cls) p.className = l.cls;
    if (l.who) {
      const w = document.createElement("strong");
      w.textContent = l.who;
      p.append(w, l.text);
    } else if (l.strong) {
      const st = document.createElement("strong");
      st.textContent = l.text;
      p.append(st);
    } else {
      p.textContent = l.text;
    }
    return p;
  }));
  chargeCta.classList.toggle("is-visible", $$("input:checked", charge).length > 0);
}

// Le texte disparaît en fondu, change, puis réapparaît
let chargeTimer;
function updateCharge(animate = false) {
  clearTimeout(chargeTimer);
  if (!animate || reduceMotion) { chargeOut.classList.remove("is-fading"); renderCharge(); return; }
  chargeOut.classList.add("is-fading");
  chargeTimer = setTimeout(() => { renderCharge(); chargeOut.classList.remove("is-fading"); }, 200);
}
charge.addEventListener("change", () => updateCharge(true));
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

/* ---------- Hero : la vidéo s'agrandit au défilement ----------
   GSAP et ScrollTrigger sont chargés depuis cdnjs avant ce fichier. S'ils manquent, ou si
   « réduire les animations » est activé, le hero reste simplement affiché tel quel. */
const heroStage = $("#xhero-stage");
if (heroStage && !reduceMotion && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroStage,
      start: "top top",
      end: "+=150%",
      scrub: true,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  tl.to("#xhero-video", { top: "0%", left: "0%", right: "0%", bottom: "0%", borderRadius: 0, ease: "none" }, 0)
    .to("#xhero-overlay", { opacity: 0, scale: 1.15, filter: "blur(12px)", ease: "none" }, 0);
}

// Horloges : Paris, Réunion, Antilles
const clockEls = $$(".xhero__time");
const clockFormats = new Map();
function tickClocks() {
  const now = new Date();
  clockEls.forEach((el) => {
    const tz = el.dataset.tz;
    if (!clockFormats.has(tz)) {
      try {
        clockFormats.set(tz, new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: tz }));
      } catch { clockFormats.set(tz, null); }
    }
    const f = clockFormats.get(tz);
    el.textContent = f ? f.format(now) : "--:--:--";
  });
}
if (clockEls.length) { tickClocks(); setInterval(tickClocks, 1000); }

/* ---------- La méthode : bloc actif et ligne de progression ---------- */
const etapesEl = $("#etapes");
const etapes = $$(".etape");
if (etapesEl && etapes.length && !reduceMotion) {
  etapesEl.classList.add("is-live");
  const setActive = (el) => etapes.forEach((e) => e.classList.toggle("is-active", e === el));
  setActive(etapes[0]);
  // Zone de déclenchement : une ligne au milieu de l'écran
  const activeObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActive(en.target); });
  }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
  etapes.forEach((e) => activeObs.observe(e));

  // La ligne se remplit jusqu'au milieu de l'écran
  let ticking = false;
  const updateEtapes = () => {
    ticking = false;
    const r = etapesEl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight / 2 - r.top) / r.height));
    etapesEl.style.setProperty("--progress", p.toFixed(4));
  };
  const onRailScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateEtapes); } };
  window.addEventListener("scroll", onRailScroll, { passive: true });
  window.addEventListener("resize", onRailScroll);
  updateEtapes();
}

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
  // Les réponses à choix partent avec le libellé affiché, même s'il a été modifié
  $$("input[type='radio']:checked", form).forEach((r) => {
    data[r.name] = r.nextElementSibling ? r.nextElementSibling.textContent.trim() : r.value;
  });
  const endpoint = SITE.reglages.adresseFormulaire;
  const done = $("#apply-done");
  const doneTitle = $("#apply-done-title");
  const doneText = $("#apply-done-text");

  if (!endpoint) {
    err.textContent = "L'envoi n'est pas encore branché. Écris-nous sur Instagram (@dyetlau) en attendant.";
    return;
  }

  const sendLabel = btnSend.innerHTML;
  btnSend.disabled = true;
  btnSend.textContent = "Envoi…";
  try {
    const res = await fetch(endpoint, {
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
    btnSend.innerHTML = sendLabel;
  }
});
showStep(0, false);

/* ---------- Fenêtres ---------- */
$$("[data-open]").forEach((b) => b.addEventListener("click", () => {
  if (document.documentElement.classList.contains("edition") && b.closest("[data-k]") === b) return;
  const d = document.getElementById(b.dataset.open);
  if (d && d.showModal) d.showModal();
}));
$$("dialog").forEach((d) => {
  $("[data-close]", d).addEventListener("click", () => d.close());
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
});

/* ---------- Démarrage ---------- */
const ready = loadSite().then((site) => {
  Object.assign(SITE, site);
  applyTexts(SITE.textes);
  renderCards(SITE.cartes);
  applySettings(SITE.reglages);
  updateCharge();
  document.documentElement.classList.remove("textes-en-attente");
  // Les textes peuvent changer les hauteurs : on recalcule les points de déclenchement
  if (window.ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
  return SITE;
});
// Filet de sécurité : la page s'affiche même si le chargement traîne
setTimeout(() => document.documentElement.classList.remove("textes-en-attente"), 1500);

// Utilisé par editor.js (mode édition de l'aperçu)
window.DYLAU = { SITE, ready, applyTexts, renderCards, applySettings, cleanHTML, youtubeId, CARD_PLACEHOLDERS };
