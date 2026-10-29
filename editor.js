/* Dy&Lau — mode édition
   Ne s'active que dans l'aperçu claude.ai, pour une personne qui peut modifier la page.
   Sur le vrai site, ce fichier ne fait rien.
   On clique sur un texte pour le changer ; « Enregistrer » réécrit textes.json. */

(async () => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  // Le visualiseur claude.ai fournit window.claude ; ailleurs, on s'arrête là.
  for (let i = 0; i < 30 && !window.claude?.use; i++) await new Promise((r) => setTimeout(r, 100));
  if (!window.claude?.use || !window.DYLAU) return;

  const artifact = await window.claude.use("artifact");
  if (!artifact) return;
  const user = await window.claude.use("user");
  if (user && !(await user.canEdit())) return;

  const D = window.DYLAU;
  await D.ready;

  const root = document.documentElement;
  let editing = false;
  let saving = false;
  const dirty = new Set();
  let cardsDirty = false;
  let settingsDirty = false;
  let originals = new Map();
  let pendingSettings = null;
  let unhidden = [];

  /* ---------- Interface ---------- */
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "ed-launch";
  launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg><span>Modifier les textes</span>';

  const bar = document.createElement("div");
  bar.className = "ed-bar";
  bar.hidden = true;
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Mode édition");
  bar.innerHTML = `
    <p class="ed-status" id="ed-status" aria-live="polite">Clique sur un texte pour le modifier.</p>
    <div class="ed-actions">
      <button type="button" class="ed-btn" data-ed="liens">Liens et vidéos</button>
      <button type="button" class="ed-btn" data-ed="legal">Mentions légales</button>
      <button type="button" class="ed-btn" data-ed="privacy">Confidentialité</button>
      <button type="button" class="ed-btn" data-ed="annuler">Annuler</button>
      <button type="button" class="ed-btn ed-btn--save" data-ed="enregistrer">Enregistrer</button>
    </div>`;
  const status = $(".ed-status", bar);

  const panel = document.createElement("dialog");
  panel.className = "modal ed-panel";
  panel.setAttribute("aria-labelledby", "ed-panel-title");
  panel.innerHTML = `
    <form class="modal__inner ed-form" method="dialog">
      <h2 id="ed-panel-title">Liens et vidéos</h2>
      <p>Colle un lien YouTube complet (youtube.com ou youtu.be). Laisse vide ce que tu n'as pas encore.</p>
      <label for="ed-videoAli">Vidéo où Ali parle de sa journée signature</label>
      <input id="ed-videoAli" name="videoAli" type="url" placeholder="https://youtu.be/…">
      <label for="ed-videoAliSeconde">À quelle seconde il en parle</label>
      <input id="ed-videoAliSeconde" name="videoAliSeconde" type="number" min="0" step="1" inputmode="numeric" placeholder="Ex. 95 pour 1 min 35">
      <label for="ed-videoJourneeSignature">Vidéo d'une journée signature</label>
      <input id="ed-videoJourneeSignature" name="videoJourneeSignature" type="url" placeholder="https://youtu.be/…">
      <label for="ed-lienMasterclass">Lien de la Masterclass Business (playlist YouTube)</label>
      <input id="ed-lienMasterclass" name="lienMasterclass" type="url" placeholder="https://www.youtube.com/playlist?list=…">
      <label for="ed-emailContact">E-mail de contact (pied de page)</label>
      <input id="ed-emailContact" name="emailContact" type="email" placeholder="bonjour@…">
      <label for="ed-adresseFormulaire">Adresse qui reçoit les candidatures</label>
      <input id="ed-adresseFormulaire" name="adresseFormulaire" type="url" placeholder="https://formspree.io/f/…" aria-describedby="ed-form-hint">
      <p class="ed-hint" id="ed-form-hint">Par exemple un formulaire Formspree. Tant que c'est vide, le formulaire n'envoie rien.</p>
      <label for="ed-videoFond">Vidéo de fond du haut de page (fichier .mp4)</label>
      <input id="ed-videoFond" name="videoFond" type="text" placeholder="Assets/Videos/hero.mp4">
      <div class="ed-form-actions">
        <button type="button" class="btn btn--ghost" data-ed-close>Fermer</button>
        <button type="submit" class="btn btn--blue">Appliquer</button>
      </div>
    </form>`;

  document.body.append(launcher, bar, panel);

  const say = (msg) => { status.textContent = msg; };
  const isDirty = () => dirty.size > 0 || cardsDirty || settingsDirty;
  const refreshSave = () => {
    $("[data-ed='enregistrer']", bar).disabled = saving || !isDirty();
  };

  /* ---------- Cartes : champ lien YouTube en mode édition ---------- */
  function addCardInputs() {
    $$(".card", document).forEach((card) => {
      const i = Number(card.dataset.card);
      const body = $(".card__body", card);
      const wrap = document.createElement("div");
      wrap.className = "ed-card-link";
      const id = `ed-card-yt-${i}`;
      wrap.innerHTML = `<label for="${id}">Lien YouTube</label><input id="${id}" type="url" placeholder="https://youtu.be/…">`;
      const input = $("input", wrap);
      input.value = D.SITE.cartes[i]?.youtube || "";
      input.addEventListener("input", () => { cardsDirty = true; refreshSave(); say("Modifications non enregistrées."); });
      body.append(wrap);
      $$("[data-field]", card).forEach((el) => {
        el.contentEditable = "true";
        el.spellcheck = true;
        // Le texte d'attente est sélectionné : on tape directement par-dessus
        el.addEventListener("focus", () => {
          if (el.textContent !== D.CARD_PLACEHOLDERS[el.dataset.field]) return;
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
      });
    });
  }

  function readCards() {
    return $$(".card", document).map((card) => {
      const i = Number(card.dataset.card);
      const prev = D.SITE.cartes[i] || {};
      const out = { ...prev };
      $$("[data-field]", card).forEach((el) => {
        const f = el.dataset.field;
        const txt = el.textContent.replace(/\s+/g, " ").trim();
        out[f] = txt === D.CARD_PLACEHOLDERS[f] ? "" : txt;
      });
      const yt = $(".ed-card-link input", card);
      if (yt) out.youtube = yt.value.trim();
      return out;
    });
  }

  /* ---------- Entrer / sortir du mode édition ---------- */
  function enter() {
    editing = true;
    root.classList.add("edition");
    launcher.hidden = true;
    bar.hidden = false;
    originals = new Map($$("[data-k]").map((el) => [el.dataset.k, el.innerHTML]));
    $$("[data-k]").forEach((el) => { el.contentEditable = "true"; el.spellcheck = true; });
    $$("details.qa").forEach((d) => { d.dataset.edWasOpen = d.open ? "1" : ""; d.open = true; });
    unhidden = $$("#apply-prev, #apply-next, #apply-send").filter((b) => b.hidden);
    unhidden.forEach((b) => { b.hidden = false; });
    addCardInputs();
    say("Clique sur un texte pour le modifier.");
    refreshSave();
  }

  function leave() {
    editing = false;
    root.classList.remove("edition");
    $$("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    $$("details.qa").forEach((d) => { d.open = d.dataset.edWasOpen === "1"; delete d.dataset.edWasOpen; });
    unhidden.forEach((b) => { b.hidden = true; });
    unhidden = [];
    $$(".ed-card-link").forEach((n) => n.remove());
    bar.hidden = true;
    launcher.hidden = false;
    dirty.clear();
    cardsDirty = false;
    settingsDirty = false;
    pendingSettings = null;
  }

  function cancel() {
    originals.forEach((html, k) => {
      const el = $(`[data-k="${CSS.escape(k)}"]`);
      if (el) el.innerHTML = html;
    });
    leave();
    D.renderCards(D.SITE.cartes);
    D.applySettings(D.SITE.reglages);
  }

  /* ---------- Enregistrer ---------- */
  async function save() {
    if (saving || !isDirty()) return;
    saving = true;
    refreshSave();
    say("Enregistrement…");

    const textes = { ...D.SITE.textes };
    dirty.forEach((k) => {
      const el = $(`[data-k="${CSS.escape(k)}"]`);
      if (el) textes[k] = D.cleanHTML(el.innerHTML);
    });
    const cartes = readCards();
    const reglages = { ...D.SITE.reglages, ...(pendingSettings || {}) };
    const data = {
      _lisezmoi: "Textes du site Dy&Lau. Modifiables depuis le mode édition de l'aperçu, ou à la main ici. 'textes' remplace le texte des éléments marqués data-k dans index.html.",
      textes,
      cartes,
      reglages,
    };

    try {
      await artifact.publish({
        "textes.json": { content: JSON.stringify(data, null, 2) + "\n", contentType: "application/json" },
      });
      Object.assign(D.SITE, { textes, cartes, reglages });
      leave();
      D.applyTexts(textes);
      D.renderCards(cartes);
      D.applySettings(reglages);
      flash("Enregistré. Tes modifications sont en ligne sur l'aperçu.");
    } catch (e) {
      const code = e && e.code;
      if (code === "conflict") {
        say("Une version plus récente vient d'être enregistrée ailleurs. La page se recharge ; refais ta modification.");
      } else if (["not_writer", "not_granted", "not_declared", "consent_required", "capability_disabled", "capability_removed"].includes(code)) {
        say("L'enregistrement n'est pas possible depuis cette vue. Ouvre l'aperçu depuis ton compte claude.ai (pas un lien public).");
      } else if (code === "rate_limited") {
        say("Trop d'enregistrements d'affilée. Attends une minute, puis réessaie.");
      } else {
        say("L'enregistrement n'a pas fonctionné. Réessaie dans un instant.");
      }
    } finally {
      saving = false;
      refreshSave();
    }
  }

  function flash(msg) {
    const t = document.createElement("p");
    t.className = "ed-toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.append(t);
    setTimeout(() => t.remove(), 4000);
  }

  /* ---------- Panneau liens et vidéos ---------- */
  function openPanel() {
    const r = { ...D.SITE.reglages, ...(pendingSettings || {}) };
    $$("input", panel).forEach((inp) => { inp.value = r[inp.name] ?? ""; });
    panel.showModal();
  }
  $("form", panel).addEventListener("submit", () => {
    const r = {};
    $$("input", panel).forEach((inp) => {
      r[inp.name] = inp.name === "videoAliSeconde" ? Number(inp.value) || 0 : inp.value.trim();
    });
    pendingSettings = r;
    settingsDirty = true;
    D.applySettings({ ...D.SITE.reglages, ...r });
    say("Liens appliqués. Clique sur « Enregistrer » pour les garder.");
    refreshSave();
  });
  $("[data-ed-close]", panel).addEventListener("click", () => panel.close());

  /* ---------- Événements ---------- */
  launcher.addEventListener("click", enter);
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ed]");
    if (!b) return;
    const act = b.dataset.ed;
    if (act === "enregistrer") save();
    else if (act === "annuler") cancel();
    else if (act === "liens") openPanel();
    else if (act === "legal" || act === "privacy") document.getElementById(act)?.showModal();
  });

  // Saisie : on note ce qui a changé
  document.addEventListener("input", (e) => {
    if (!editing) return;
    const k = e.target.closest?.("[data-k]");
    if (k) { dirty.add(k.dataset.k); say("Modifications non enregistrées."); refreshSave(); return; }
    if (e.target.closest?.("[data-field]")) { cardsDirty = true; say("Modifications non enregistrées."); refreshSave(); }
  });

  // En mode édition, un clic sur un lien ou un bouton du site ne navigue pas
  document.addEventListener("click", (e) => {
    if (!editing) return;
    if (e.target.closest(".ed-bar, .ed-launch, .ed-panel, .ed-card-link, [data-close], .rail-btn, .nav__burger")) return;
    if (e.target.closest("a, summary, label, button, .card__play")) e.preventDefault();
  }, true);

  // Entrée = retour à la ligne ; collage en texte simple ; Espace dans une question de la FAQ
  document.addEventListener("keydown", (e) => {
    if (!editing) return;
    const ed = e.target.closest?.("[contenteditable='true']");
    if (!ed) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (!ed.dataset.field) document.execCommand("insertLineBreak");
    } else if (e.key === " " && ed.closest("summary, button, a, label")) {
      e.preventDefault();
      document.execCommand("insertText", false, " ");
    }
  });
  document.addEventListener("paste", (e) => {
    if (!editing || !e.target.closest?.("[contenteditable='true']")) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text.replace(/\s*\n\s*/g, " "));
  });

  window.addEventListener("beforeunload", (e) => {
    if (editing && isDirty()) { e.preventDefault(); e.returnValue = ""; }
  });
})();
