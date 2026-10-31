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

// Chaque barre (l'originale et sa copie) a son propre menu déroulant
const menus = $$(".nav__burger").map((burger) => ({
  burger,
  links: document.getElementById(burger.getAttribute("aria-controls")),
  bar: burger.closest(".nav"),
}));
function setMenu(m, open) {
  m.burger.setAttribute("aria-expanded", String(open));
  m.burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  m.links.classList.toggle("is-open", open);
  m.bar.classList.toggle("menu-open", open);
}
menus.forEach((m) => {
  m.burger.addEventListener("click", () => setMenu(m, m.burger.getAttribute("aria-expanded") !== "true"));
  m.links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(m, false); });
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") menus.forEach((m) => setMenu(m, false)); });

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

/* ---------- Les transformations : carrousel « squeeze » en boucle ----------
   Un panneau ouvert prend la place, les suivants se resserrent en colonnes puis en
   lamelles sur la droite. Avancer élargit la lamelle suivante et fait glisser la bande ;
   la bande ne fait que s'allonger pendant le mouvement, puis on la recoupe sans animation. */
const list = $("#transfo-list");
const rail = $("#rail");
const strip = $("#sq-strip");
const carousel = $("#carousel");
const CARD_PLACEHOLDERS = { impact: "Transformation à venir", nom: "Prénom à venir", secteur: "Secteur à préciser" };
const SQ_SHARES = [-0.06, 0.61, 0.3, 0.15];
const SQ_STRETCHED = [0, 0.71, 0.4, 0.25];
const SQ_SQUEEZED = [-0.12, 0.59, 0.28, 0.13];
const SQ_MS = reduceMotion ? 0 : 1000;
const SQ_AUTOPLAY = 6000;
let sqSlides = [];
let sqCards = [];   // { slide, el } dans l'ordre de la bande
let sqColumn = 0;   // colonne de la première carte de la bande
let sqSlid = 0;     // décalage de la bande, compté en lamelles
let sqForward = true;
let sqHover = -1;
let sqTimers = [];
let sqAuto = 0;
let sqPaused = false;
const sqVisible = () => 4 + Math.max(1, Math.min(3, sqSlides.length - 4));
const sqWrap = (i) => ((i % sqSlides.length) + sqSlides.length) % sqSlides.length;
const sqOpen = () => sqCards[-sqColumn]?.slide ?? 0;

function sqShare(col) {
  if (sqHover < 0 || sqHover > 3 || reduceMotion) return SQ_SHARES[col];
  return sqHover === col ? SQ_STRETCHED[col] : SQ_SQUEEZED[col];
}
function sqWidth(col) {
  if (col < 0 || col > 3) return "var(--sq-slat)";
  if (col === 0) return `calc(var(--sq-hero) + var(--sq-room) * ${sqShare(0)})`;
  return `calc(var(--sq-room) * ${sqShare(col)})`;
}

// Le visuel d'un témoignage : la miniature YouTube, sinon un fond aux couleurs de la marque
function sqMedia(t, i) {
  const id = youtubeId(t.youtube);
  if (id) {
    const img = document.createElement("img");
    img.className = "sq__pic";
    img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    img.alt = "";
    img.draggable = false;
    img.loading = "lazy";
    return img;
  }
  const soon = document.createElement("span");
  soon.className = `sq__pic sq__soon sq__soon--${i % 3}`;
  soon.innerHTML = '<span class="sq__soon-mark">Dy<b>&amp;</b>Lau</span><span class="sq__soon-txt">Vidéo bientôt en ligne</span>';
  return soon;
}

function sqPanel(slide) {
  const t = sqSlides[slide];
  const el = document.createElement("button");
  el.type = "button";
  el.className = "sq__panel";
  el.setAttribute("role", "tab");
  el.setAttribute("aria-label", t.nom ? `Témoignage de ${t.nom}` : "Témoignage à venir");
  el.append(sqMedia(t, slide));
  const tag = document.createElement("span");
  tag.className = "sq__tag";
  tag.setAttribute("aria-hidden", "true");
  tag.textContent = t.nom || "";
  if (t.nom) el.append(tag);
  el.addEventListener("mousemove", () => {
    const col = sqCards.findIndex((c) => c.el === el) + sqColumn;
    if (col !== sqHover) { sqHover = col; sqLayout(); }
  });
  el.addEventListener("click", () => {
    if (sqDragged) return;
    const col = sqCards.findIndex((c) => c.el === el) + sqColumn;
    if (col > 0) sqStep(col);
    else if (col === 0) sqPlay();
  });
  return { slide, el };
}

function sqLayout(still = false) {
  carousel.classList.toggle("is-still", still);
  strip.style.transform = `translateX(calc(${sqSlid} * (var(--sq-slat) + var(--sq-gap))))`;
  sqCards.forEach((c, place) => {
    const col = place + sqColumn;
    const w = sqWidth(col);
    c.el.style.width = w;
    c.el.style.marginLeft = place === 0 ? "0px" : col < 4 ? "var(--sq-gap)" : "var(--sq-slat-gap)";
    c.el.style.borderRadius = `min(var(--sq-radius), calc(${w} / 2))`;
    c.el.classList.toggle("is-front", col === 0);
    c.el.setAttribute("aria-selected", String(col === 0));
    c.el.tabIndex = col === 0 ? 0 : -1;
  });
  const open = sqOpen();
  $$(".sq__cap", list).forEach((cap) => {
    const on = Number(cap.dataset.card) === open;
    cap.classList.toggle("is-shown", on);
    cap.setAttribute("aria-hidden", String(!on));
  });
}

function sqSettle() {
  const n = sqVisible();
  const keep = sqForward ? sqCards.slice(-n) : sqCards.slice(0, n);
  sqCards.filter((c) => !keep.includes(c)).forEach((c) => c.el.remove());
  sqCards = keep;
  sqColumn = 0;
  sqSlid = 0;
  sqLayout(true);
  void strip.offsetWidth;
  requestAnimationFrame(() => carousel.classList.remove("is-still"));
}

function sqStopVideo() {
  $$(".sq__panel iframe", strip).forEach((f) => f.remove());
}

function sqStep(by) {
  if (sqSlides.length < 2 || !by) return;
  sqStopVideo();
  sqTimers.forEach(clearTimeout);
  sqTimers = [];
  sqForward = by > 0;
  if (by > 0) {
    // La lamelle qui arrive rejoint la queue à sa taille avant que rien ne bouge
    for (let k = 0; k < by; k++) {
      const c = sqPanel(sqWrap(sqCards[sqCards.length - 1].slide + 1));
      sqCards.push(c);
      c.el.style.width = "var(--sq-slat)";
      c.el.style.marginLeft = "var(--sq-slat-gap)";
      strip.append(c.el);
    }
    sqColumn -= by;
    sqSlid -= by;
    void strip.offsetWidth;
    sqLayout();
  } else {
    // En arrière, la bande grandit par la tête : on la décale d'autant sans animation, puis elle revient
    for (let k = 0; k < -by; k++) {
      const c = sqPanel(sqWrap(sqCards[0].slide - 1));
      sqCards.unshift(c);
      strip.prepend(c.el);
    }
    sqSlid += by;
    sqLayout(true);
    void strip.offsetWidth;
    sqTimers.push(setTimeout(() => { carousel.classList.remove("is-still"); sqSlid = 0; sqLayout(); }, 20));
  }
  sqTimers.push(setTimeout(sqSettle, SQ_MS + 40));
  sqSchedule();
}

function sqGo(to) {
  const here = sqOpen();
  if (to === here) return;
  const fwd = sqWrap(to - here);
  sqStep(fwd <= sqSlides.length / 2 ? fwd : fwd - sqSlides.length);
}

// Lecture : la vidéo s'ouvre dans le grand panneau (sur l'aperçu claude.ai, YouTube s'ouvre à part)
function sqPlay() {
  const t = sqSlides[sqOpen()];
  const id = youtubeId(t && t.youtube);
  if (!id || root.classList.contains("edition")) return;
  const start = Number(t.debut) || 0;
  if (window.claude) {
    window.open(`https://www.youtube.com/watch?v=${id}${start ? `&t=${Math.floor(start)}s` : ""}`, "_blank", "noopener");
    return;
  }
  const front = sqCards[-sqColumn];
  if (!front || $("iframe", front.el)) return;
  sqPaused = true;
  front.el.append(youtubeFrame(id, start, `la transformation de ${t.nom || "ce client"}`));
}

function sqSchedule() {
  clearTimeout(sqAuto);
  if (reduceMotion || sqPaused || sqSlides.length < 2 || root.classList.contains("edition")) return;
  sqAuto = setTimeout(() => sqStep(1), SQ_AUTOPLAY);
}

function makeCaption(t, i) {
  const cap = document.createElement("div");
  cap.className = "sq__cap";
  cap.dataset.card = String(i);
  if (i === 0) cap.id = "transfo-ali";
  cap.innerHTML = `
    <div class="card__body">
      <p class="sq__label" data-field="secteur"></p>
      <p class="sq__text"><span class="sq__impact" data-field="impact"></span> <span class="sq__who" data-field="nom"></span></p>
    </div>`;
  $$("[data-field]", cap).forEach((el) => {
    const f = el.dataset.field;
    el.textContent = t[f] || CARD_PLACEHOLDERS[f];
    el.classList.toggle("todo", !t[f]);
  });
  if (youtubeId(t.youtube)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--gold btn--cta sq__action";
    btn.textContent = "Regarder son histoire";
    btn.addEventListener("click", sqPlay);
    cap.append(btn);
  }
  return cap;
}

function renderCards(cartes) {
  sqSlides = cartes;
  sqTimers.forEach(clearTimeout);
  sqTimers = [];
  list.replaceChildren(...cartes.map(makeCaption));
  const start = Math.min(sqOpen(), cartes.length - 1);
  sqColumn = 0;
  sqSlid = 0;
  sqCards = [];
  for (let p = 0; p < sqVisible(); p++) sqCards.push(sqPanel(sqWrap(start + p)));
  strip.replaceChildren(...sqCards.map((c) => c.el));
  sqLayout(true);
  requestAnimationFrame(() => requestAnimationFrame(() => carousel.classList.remove("is-still")));
  sqSchedule();
}

$("[data-rail='prev']").addEventListener("click", () => sqStep(-1));
$("[data-rail='next']").addEventListener("click", () => sqStep(1));
carousel.addEventListener("keydown", (e) => {
  if (!e.target.closest(".sq__strip")) return;
  if (e.key === "ArrowRight") { e.preventDefault(); sqStep(1); strip.querySelector(".is-front")?.focus(); }
  if (e.key === "ArrowLeft") { e.preventDefault(); sqStep(-1); strip.querySelector(".is-front")?.focus(); }
});
carousel.addEventListener("mouseenter", () => { sqPaused = true; clearTimeout(sqAuto); });
carousel.addEventListener("mouseleave", () => {
  sqHover = -1;
  sqLayout(carousel.classList.contains("is-still"));
  if (!$(".sq__panel iframe", strip)) { sqPaused = false; sqSchedule(); }
});
carousel.addEventListener("focusin", () => { sqPaused = true; clearTimeout(sqAuto); });
carousel.addEventListener("focusout", (e) => {
  if (carousel.contains(e.relatedTarget) || $(".sq__panel iframe", strip)) return;
  sqPaused = false;
  sqSchedule();
});

// Défilement : glisser au doigt ou à la souris, ou balayer le pavé tactile, fait avancer la bande
let sqDragX = null;
let sqDragged = false;
rail.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || root.classList.contains("edition")) return;
  sqDragX = e.clientX;
  sqDragged = false;
});
window.addEventListener("pointermove", (e) => {
  if (sqDragX === null) return;
  const dx = e.clientX - sqDragX;
  if (!sqDragged && Math.abs(dx) > 40) {
    sqDragged = true;
    sqStep(dx < 0 ? 1 : -1);
  }
});
window.addEventListener("pointerup", () => {
  sqDragX = null;
  setTimeout(() => { sqDragged = false; }, 0);
});
let sqWheel = 0;
let sqWheelLock = 0;
rail.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  if (Date.now() < sqWheelLock) return;
  sqWheel += e.deltaX;
  if (Math.abs(sqWheel) > 60) {
    sqStep(sqWheel > 0 ? 1 : -1);
    sqWheel = 0;
    sqWheelLock = Date.now() + Math.max(SQ_MS * 0.6, 300);
  }
}, { passive: false });

// La lecture automatique ne tourne que lorsque le carrousel est à l'écran
new IntersectionObserver(([en]) => {
  if (en.isIntersecting) { if (!sqPaused) sqSchedule(); }
  else clearTimeout(sqAuto);
}).observe(carousel);

/* ---------- Réglages : vidéos, liens, contact ---------- */
const VIDEO_PLACEHOLDER = '<div class="sig-placeholder"><span class="sig-placeholder__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span><p>Vidéo bientôt en ligne</p></div>';

function applySettings(r) {
  // Vidéo de fond : version légère sur téléphone, rien si « réduire les animations » ou économie de données
  const small = window.matchMedia("(max-width: 760px)").matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  $$(".hero__video").forEach((v) => {
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
  });

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
const heroWrap = $("#xhero-wrap");
if (heroStage && heroWrap && !reduceMotion && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  heroWrap.classList.add("is-live");
  gsap.set("#hero-copie", { filter: "blur(14px)" });
  // 1. la vidéo s'agrandit jusqu'au plein écran ; 2. elle s'efface et la section du dessous
  //    apparaît à travers elle, de floue à nette. La page reste bloquée pendant les deux étapes.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroWrap,
      start: "top top",
      end: "+=250%",
      scrub: true,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  tl.to("#xhero-video", { top: "0%", left: "0%", right: "0%", bottom: "0%", borderRadius: 0, ease: "none", duration: 1.5 }, 0)
    .to("#xhero-overlay", { opacity: 0, scale: 1.15, filter: "blur(12px)", ease: "none", duration: 1.5 }, 0)
    .to("#top", { autoAlpha: 0, ease: "none", duration: 1 }, 1.5)
    .to("#hero-copie", { filter: "blur(0px)", ease: "none", duration: 1 }, 1.5);
}


/* ---------- Lueur qui suit la souris (effet GlowCard) ---------- */
const GLOW_SEL = ".card, .etape, .sig-benefit";
let glowX = -9999;
let glowY = -9999;
let glowTick = false;
function paintGlow() {
  glowTick = false;
  const p = Math.round(Math.min(1, Math.max(0, glowX / window.innerWidth)) * 100);
  const color = `color-mix(in oklab, #00399c ${p}%, #f1cb5a)`;
  $$(GLOW_SEL).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -300 || r.top > window.innerHeight + 300) return;
    el.style.setProperty("--gx", `${(glowX - r.left).toFixed(1)}px`);
    el.style.setProperty("--gy", `${(glowY - r.top).toFixed(1)}px`);
    el.style.setProperty("--glow", color);
  });
}
const queueGlow = () => { if (!glowTick) { glowTick = true; requestAnimationFrame(paintGlow); } };
document.addEventListener("pointermove", (e) => { glowX = e.clientX; glowY = e.clientY; queueGlow(); }, { passive: true });
// Les cartes bougent sous la souris immobile (défilement, carrousel) : on recalcule
window.addEventListener("scroll", queueGlow, { passive: true });
document.getElementById("rail")?.addEventListener("scroll", queueGlow, { passive: true });

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

/* ---------- Défilé de photos (Masterclass) ---------- */
const mqTrack = $("#mq-track");
if (mqTrack) {
  [...mqTrack.children].forEach((li) => {
    const clone = li.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    mqTrack.appendChild(clone);
  });
}

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
