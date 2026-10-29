/* ==========================================================================
   Dy&Lau · scripts du site
   ========================================================================== */

// Adresse qui reçoit les candidatures (Formspree ou équivalent).
// Exemple : 'https://formspree.io/f/abcdwxyz'. Tant qu'elle est vide,
// le formulaire affiche la confirmation mais n'envoie rien.
const FORM_ENDPOINT = '';

// Réglages des liens et des vidéos (à compléter quand les liens existent).
const SETTINGS = {
  // Identifiant YouTube de la vidéo de témoignages : les 11 caractères après « v= » ou « youtu.be/ ».
  videoTemoignages: '',
  // Moment où Ali parle de sa journée signature dans cette vidéo, en secondes (2 min 15 s = 135).
  aliStartSeconds: 0,
  // Identifiant YouTube de la vidéo d'une journée signature.
  videoJournee: '',
  // Lien de la playlist de la formation gratuite.
  formationUrl: '',
  // Lien de la chaîne YouTube.
  youtubeChannelUrl: '',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   En-tête qui se réduit au défilement
   -------------------------------------------------------------------------- */
const bar = document.getElementById('bar');
if (bar) {
  const onScroll = () => bar.classList.toggle('is-small', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   Liens de la formation et de la chaîne YouTube
   -------------------------------------------------------------------------- */
if (SETTINGS.formationUrl) {
  document.querySelectorAll('[data-formation-link], [data-formation-button]').forEach((a) => {
    a.href = SETTINGS.formationUrl;
    a.hidden = false;
  });
}
if (SETTINGS.youtubeChannelUrl) {
  document.querySelectorAll('[data-youtube-channel]').forEach((a) => {
    a.href = SETTINGS.youtubeChannelUrl;
    a.hidden = false;
  });
}

/* --------------------------------------------------------------------------
   Vidéos YouTube : image de couverture, puis lecteur chargé au clic
   -------------------------------------------------------------------------- */
const VIDEO_IDS = { temoignages: SETTINGS.videoTemoignages, journee: SETTINGS.videoJournee };

function playVideo(box, start) {
  const id = VIDEO_IDS[box.dataset.video];
  if (!id) return false;
  const params = new URLSearchParams({ autoplay: '1', rel: '0', cc_load_policy: '1', cc_lang_pref: 'fr', hl: 'fr' });
  if (start) params.set('start', String(start));
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?' + params;
  iframe.title = box.dataset.title || 'Vidéo';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  box.replaceChildren(iframe);
  iframe.focus();
  return true;
}

document.querySelectorAll('.yt[data-video]').forEach((box) => {
  const id = VIDEO_IDS[box.dataset.video];
  if (!id) return; // « Vidéo bientôt en ligne » reste affiché
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'yt__play';
  btn.setAttribute('aria-label', 'Lire la vidéo : ' + (box.dataset.title || ''));
  const img = document.createElement('img');
  img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
  img.alt = '';
  img.loading = 'lazy';
  img.width = 480;
  img.height = 360;
  const icon = document.createElement('span');
  icon.className = 'yt__icon';
  btn.append(img, icon);
  btn.addEventListener('click', () => playVideo(box));
  box.replaceChildren(btn);
});

// « Écouter Ali » : lance la vidéo de témoignages au moment où il parle
const aliLink = document.getElementById('ecouter-ali');
const testimonialBox = document.getElementById('video-temoignages');
if (aliLink && testimonialBox) {
  aliLink.addEventListener('click', (e) => {
    if (!SETTINGS.videoTemoignages) return; // sans vidéo : simple lien vers la section
    e.preventDefault();
    testimonialBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    playVideo(testimonialBox, SETTINGS.aliStartSeconds);
  });
}

/* --------------------------------------------------------------------------
   Apparition douce des blocs au défilement
   -------------------------------------------------------------------------- */
const reveals = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // Les blocs voisins arrivent l'un après l'autre
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.transitionDelay = Math.min(siblings.indexOf(el), 4) * 90 + 'ms';
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  reveals.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------------------
   Compteurs animés
   -------------------------------------------------------------------------- */
const counters = document.querySelectorAll('[data-count]');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const co = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      co.unobserve(entry.target);
      const el = entry.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = end > 10 ? 1600 : 1100;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => co.observe(c));
}

/* --------------------------------------------------------------------------
   Léger mouvement de la photo du haut de page au défilement (GSAP)
   -------------------------------------------------------------------------- */
function setupParallax() {
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const heroImg = document.querySelector('.hero__media img');
  if (heroImg) {
    gsap.fromTo(heroImg, { scale: 1.08, yPercent: -3 }, {
      scale: 1, yPercent: 3, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
  document.querySelectorAll('.about__main img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.1 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
setupParallax();

/* --------------------------------------------------------------------------
   Formulaire de candidature en étapes
   -------------------------------------------------------------------------- */
const form = document.getElementById('candidature');
if (form) {
  const steps = [...form.querySelectorAll('[data-step]')];
  const barEl = form.querySelector('.form__bar');
  const progress = form.querySelector('.form__progress');
  const current = form.querySelector('[data-current]');
  const error = form.querySelector('.form__error');
  const prev = form.querySelector('[data-prev]');
  const next = form.querySelector('[data-next]');
  const submit = form.querySelector('[data-submit]');
  const done = form.parentElement.querySelector('.form__done');
  let index = 0;

  function show(i, focus) {
    index = i;
    steps.forEach((s, n) => s.classList.toggle('is-current', n === i));
    const n = i + 1;
    barEl.style.width = (n / steps.length) * 100 + '%';
    progress.setAttribute('aria-valuenow', String(n));
    current.textContent = String(n);
    prev.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    error.hidden = true;
    if (focus) steps[i].querySelector('input, textarea').focus();
  }

  function fail(input, message) {
    error.textContent = message;
    error.hidden = false;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
    return false;
  }

  function valid(i) {
    const step = steps[i];
    step.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    error.hidden = true;

    const radios = step.querySelectorAll('input[type="radio"]');
    if (radios.length && ![...radios].some((r) => r.checked)) {
      return fail(radios[0], 'Choisis une tranche pour continuer.');
    }
    for (const input of step.querySelectorAll('input[type="text"], input[type="tel"], textarea')) {
      if (!input.value.trim()) return fail(input, 'Réponds à cette question pour continuer.');
      if (input.type === 'tel' && input.value.replace(/\D/g, '').length < 9) {
        return fail(input, 'Indique un numéro de téléphone valide.');
      }
    }
    const consent = step.querySelector('input[type="checkbox"]');
    if (consent && !consent.checked) return fail(consent, 'Coche la case pour accepter d\'être recontacté.');
    return true;
  }

  next.addEventListener('click', () => { if (valid(index)) show(index + 1, true); });
  prev.addEventListener('click', () => show(index - 1, true));

  // Choisir une tranche passe directement à la question suivante
  form.querySelectorAll('input[type="radio"]').forEach((r) => {
    r.addEventListener('change', () => setTimeout(() => { if (valid(index)) show(index + 1, true); }, 220));
  });

  // Entrée = question suivante (sauf dans la zone de texte longue)
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'checkbox') return;
    if (index < steps.length - 1) {
      e.preventDefault();
      next.click();
    }
  });

  function finish() {
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    for (let i = 0; i < steps.length; i++) {
      if (!valid(i)) { show(i, false); valid(i); return; }
    }

    if (!FORM_ENDPOINT) { finish(); return; }

    submit.disabled = true;
    submit.textContent = 'Envoi…';
    try {
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      finish();
    } catch (err) {
      submit.disabled = false;
      submit.textContent = 'Envoyer ma candidature';
      fail(null, 'L\'envoi n\'a pas fonctionné. Vérifie ta connexion et réessaie.');
    }
  });

  show(0, false);
}
