/* Dy&Lau — page d'accueil
   ============================================================
   Les textes, les 11 transformations et les liens (vidéos, Masterclass,
   formulaire, e-mail) sont dans textes.json. On les modifie depuis le mode
   édition de l'aperçu, ou directement dans ce fichier.
   Les valeurs ci-dessous ne servent que si textes.json ne se charge pas.
   ============================================================ */

const DEFAULTS = {
  textes: {},
  cartes: [
    { impact: "3 fois son chiffre d'affaires habituel d'une journée, en 45 minutes.", nom: "Ali", secteur: "", youtube: "" },
    ...Array.from({ length: 10 }, () => ({ impact: "", nom: "", secteur: "", youtube: "" })),
  ],
  reglages: {
    videoFond: "",
    videoAli: "",
    videoAliSeconde: 0,
    videoJourneeSignature: "",
    lienMasterclass: "",
    adresseFormulaire: "",
    emailContact: "",
  },
};

document.documentElement.classList.add("js", "textes-en-attente");

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
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
}

async function loadSite() {
  try {
    const res = await fetch("textes.json", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const d = await res.json();
    return {
      textes: d.textes && typeof d.textes === "object" ? d.textes : {},
      cartes: Array.isArray(d.cartes) && d.cartes.length ? d.cartes : DEFAULTS.cartes,
      reglages: { ...DEFAULTS.reglages, ...(d.reglages || {}) },
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

/* ---------- Les 11 transformations ---------- */
const list = $("#transfo-list");
const CARD_PLACEHOLDERS = { impact: "Transformation à venir", nom: "Nom du dirigeant", secteur: "Secteur à préciser" };

function renderCards(cartes) {
  list.replaceChildren();
  cartes.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "card";
    li.dataset.card = String(i);
    const id = youtubeId(t.youtube);
    li.innerHTML = `
      <div class="card__media"></div>
      <div class="card__body">
        <p class="card__impact" data-field="impact"></p>
        <p class="card__who"><strong data-field="nom"></strong><span data-field="secteur"></span></p>
      </div>`;
    const media = $(".card__media", li);
    if (id) {
      liteVideo(media, id, `la transformation de ${t.nom || "ce dirigeant"}`, Number(t.debut) || 0);
    } else {
      media.innerHTML = '<div class="card__soon"><p class="card__soon-mark" aria-hidden="true">Dy<b>&amp;</b><br>Lau</p><p>Vidéo bientôt en ligne</p></div>';
    }
    $$("[data-field]", li).forEach((el) => {
      const f = el.dataset.field;
      el.textContent = t[f] || CARD_PLACEHOLDERS[f];
      // L'impact par défaut garde le style normal ; le nom et le secteur manquants sont signalés
      el.classList.toggle("todo", !t[f] && f !== "impact");
    });
    if (i === 0) li.id = "transfo-ali";
    list.append(li);
  });
  updateRail();
}

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
  const ratio = rail.scrollWidth ? rail.clientWidth / rail.scrollWidth : 1;
  const pos = max > 0 ? rail.scrollLeft / max : 0;
  railBar.style.width = `${Math.max(ratio, 0.08) * 100 + pos * (1 - ratio) * 100}%`;
  prev.disabled = rail.scrollLeft < 8;
  next.disabled = rail.scrollLeft > max - 8;
}
prev.addEventListener("click", () => rail.scrollBy({ left: -railStep() * 2, behavior: reduceMotion ? "auto" : "smooth" }));
next.addEventListener("click", () => rail.scrollBy({ left: railStep() * 2, behavior: reduceMotion ? "auto" : "smooth" }));
rail.addEventListener("scroll", updateRail, { passive: true });
rail.addEventListener("keydown", (e) => {
  if (e.target !== rail) return;
  if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
  if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
});
window.addEventListener("resize", updateRail);

/* ---------- Réglages : vidéos, liens, contact ---------- */
const aliLink = $("#ecouter-ali");
aliLink.addEventListener("click", () => {
  if (youtubeId(SITE.reglages.videoAli)) return;
  setTimeout(() => rail.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" }), 400);
});

function applySettings(r) {
  // Vidéo de fond
  $(".hero__media video")?.remove();
  if (r.videoFond && !reduceMotion) {
    const v = document.createElement("video");
    Object.assign(v, { src: r.videoFond, muted: true, loop: true, playsInline: true, autoplay: true });
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.poster = $(".hero__poster").currentSrc || $(".hero__poster").src;
    $(".hero__media").append(v);
    v.play().catch(() => v.remove());
  }

  // « Écouter Ali »
  const aliId = youtubeId(r.videoAli);
  if (aliId) {
    const t = Number(r.videoAliSeconde) || 0;
    aliLink.href = `https://www.youtube.com/watch?v=${aliId}${t ? `&t=${Math.floor(t)}s` : ""}`;
    aliLink.target = "_blank";
    aliLink.rel = "noopener";
  } else {
    aliLink.href = "#transfo-ali";
    aliLink.removeAttribute("target");
  }

  // Vidéo de la journée signature
  const sigSlot = $("#signature-video");
  const sigId = youtubeId(r.videoJourneeSignature);
  if (sigId) liteVideo(sigSlot, sigId, "une journée signature en images");
  else sigSlot.innerHTML = '<div class="video-slot__soon"><b>Une journée signature, en images</b><span>La vidéo arrive bientôt.</span></div>';

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
  return SITE;
});
// Filet de sécurité : la page s'affiche même si le chargement traîne
setTimeout(() => document.documentElement.classList.remove("textes-en-attente"), 1500);

// Utilisé par editor.js (mode édition de l'aperçu)
window.DYLAU = { SITE, ready, applyTexts, renderCards, applySettings, cleanHTML, youtubeId, CARD_PLACEHOLDERS };
