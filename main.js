/* ==========================================================================
   Dy&Lau · scripts du site
   ========================================================================== */

// Adresse du service qui reçoit les candidatures (Formspree, Getform…).
// Exemple : 'https://formspree.io/f/abcdwxyz'. Vide = pas de service :
// le site affiche la confirmation et ouvre un e-mail prérempli vers CONTACT_EMAIL.
const FORM_ENDPOINT = '';

// TODO: adresse e-mail de contact (contenu.md, section 14, encore à compléter).
const CONTACT_EMAIL = '';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* --------------------------------------------------------------------------
   Vidéos YouTube : une image et un bouton, la vidéo ne se charge qu'au clic
   -------------------------------------------------------------------------- */
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4l15 8-15 8z"/></svg>';

function setupVideo(box) {
  const id = (box.dataset.youtubeId || '').trim();
  if (!id) return; // l'encart « À compléter » reste affiché
  const title = box.dataset.title || 'Vidéo';
  box.innerHTML = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'yt__play';
  btn.setAttribute('aria-label', 'Lire la vidéo : ' + title);
  const img = document.createElement('img');
  img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
  img.alt = '';
  img.loading = 'lazy';
  img.width = 480;
  img.height = 360;
  const icon = document.createElement('span');
  icon.className = 'yt__icon';
  icon.innerHTML = PLAY_ICON;
  btn.append(img, icon);
  btn.addEventListener('click', () => playVideo(box));
  box.append(btn);
}

function playVideo(box, start) {
  const id = (box.dataset.youtubeId || '').trim();
  if (!id) return false;
  const params = new URLSearchParams({ autoplay: '1', rel: '0', cc_load_policy: '1', cc_lang_pref: 'fr', hl: 'fr' });
  if (start) params.set('start', String(start));
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?' + params;
  iframe.title = box.dataset.title || 'Vidéo';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  box.innerHTML = '';
  box.append(iframe);
  iframe.focus();
  return true;
}

document.querySelectorAll('.yt').forEach(setupVideo);

// « Écouter Ali » : lance la vidéo de témoignages au moment où Ali parle
const aliLink = document.getElementById('ecouter-ali');
const testimonialVideo = document.getElementById('video-temoignages');
if (aliLink && testimonialVideo) {
  aliLink.addEventListener('click', (e) => {
    const start = parseInt(aliLink.dataset.start, 10) || 0;
    if (!testimonialVideo.dataset.youtubeId) return; // pas encore de vidéo : simple lien vers la section
    e.preventDefault();
    testimonialVideo.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    playVideo(testimonialVideo, start);
  });
}

/* --------------------------------------------------------------------------
   Formulaire de candidature en étapes
   -------------------------------------------------------------------------- */
const form = document.getElementById('candidature');
if (form) {
  const steps = [...form.querySelectorAll('[data-step]')];
  const bar = form.querySelector('.form__bar');
  const progress = form.querySelector('.form__progress');
  const current = form.querySelector('[data-current]');
  const error = form.querySelector('.form__error');
  const prev = form.querySelector('[data-prev]');
  const next = form.querySelector('[data-next]');
  const submit = form.querySelector('[data-submit]');
  const done = form.parentElement.querySelector('.form__done');
  let index = 0;

  const field = (i) => steps[i].querySelector('input, textarea');

  function show(i, focus) {
    index = i;
    steps.forEach((s, n) => s.classList.toggle('is-current', n === i));
    const n = i + 1;
    bar.style.width = (n / steps.length) * 100 + '%';
    progress.setAttribute('aria-valuenow', String(n));
    current.textContent = String(n);
    prev.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    error.hidden = true;
    if (focus) field(i).focus();
  }

  function valid(i) {
    const input = field(i);
    const ok = input.value.trim().length > 0 && (input.type !== 'tel' || /\d{6,}/.test(input.value.replace(/\D/g, '')));
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    error.textContent = ok ? '' : (input.type === 'tel' ? 'Indique un numéro de téléphone valide.' : 'Réponds à cette question pour continuer.');
    error.hidden = ok;
    if (!ok) input.focus();
    return ok;
  }

  next.addEventListener('click', () => { if (valid(index)) show(index + 1, true); });
  prev.addEventListener('click', () => show(index - 1, true));

  // Entrée = question suivante (sauf dans la zone de texte longue)
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
    if (index < steps.length - 1) {
      e.preventDefault();
      next.click();
    }
  });

  function mailtoLink(data) {
    const body = [
      "Secteur d'activité : " + data.get('secteur'),
      "Chiffre d'affaires mensuel (approximatif) : " + data.get('chiffre_affaires_mensuel'),
      "Ce qui me bloque le plus aujourd'hui : " + data.get('blocage'),
      'Prénom : ' + data.get('prenom'),
      'Téléphone : ' + data.get('telephone'),
    ].join('\n');
    return 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Candidature pour un appel · ' + data.get('prenom'))
      + '&body=' + encodeURIComponent(body);
  }

  function finish(withMail) {
    form.hidden = true;
    done.hidden = false;
    done.querySelector('.form__done-mail').hidden = !withMail;
    done.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    for (let i = 0; i < steps.length; i++) {
      if (!valid(i)) { show(i, true); valid(i); return; }
    }
    const data = new FormData(form);

    if (!FORM_ENDPOINT) {
      finish(true);
      window.location.href = mailtoLink(data);
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Envoi…';
    try {
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      finish(false);
    } catch (err) {
      // Le service ne répond pas : on passe par l'e-mail pour ne rien perdre
      finish(true);
      window.location.href = mailtoLink(data);
    }
  });

  show(0, false);
}

/* --------------------------------------------------------------------------
   Chiffres qui défilent quand ils arrivent à l'écran
   -------------------------------------------------------------------------- */
const counters = document.querySelectorAll('[data-count]');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const end = parseInt(el.dataset.count, 10);
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => io.observe(c));
}

/* --------------------------------------------------------------------------
   Cartes : légère inclinaison 3D au survol (souris uniquement)
   -------------------------------------------------------------------------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* --------------------------------------------------------------------------
   Apparitions au défilement (GSAP + ScrollTrigger)
   Le contenu reste visible si GSAP ne se charge pas.
   -------------------------------------------------------------------------- */
function setupReveals() {
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('[data-reveal]').forEach((block) => {
    const parts = block.children.length > 1 && block.children.length < 12 ? [...block.children] : [block];
    gsap.from(parts, {
      y: 28,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: block, start: 'top 88%', once: true },
    });
  });

  // Le grand « 5 » glisse doucement avec le défilement
  const five = document.querySelector('.capacity__five');
  if (five) {
    gsap.fromTo(five, { yPercent: 12 }, {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: five.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  // Les photos de l'équipe : léger zoom au défilement
  document.querySelectorAll('.person__photo img, .about__main img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.08 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
setupReveals();

/* --------------------------------------------------------------------------
   Élément 3D du haut de page : deux anneaux d'or entrelacés (Dy & Lau)
   Seulement sur grand écran, sans « mouvement réduit », et si WebGL existe.
   Sinon, l'image fixe assets/images/anneaux.webp reste affichée.
   -------------------------------------------------------------------------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

async function setupHero3D() {
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.hero__canvas');
  if (!hero || !canvas) return;
  if (reduceMotion || window.innerWidth < 900 || !hasWebGL()) return;

  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (e) { return; } // pas de réseau : l'image fixe reste

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 9);

  const gold = new THREE.MeshStandardMaterial({ color: 0xf2bf3a, metalness: 1, roughness: 0.22 });
  const geo = new THREE.TorusGeometry(1.25, 0.3, 48, 160);
  const ringA = new THREE.Mesh(geo, gold);
  const ringB = new THREE.Mesh(geo, gold);
  ringA.position.x = -0.68;
  ringB.position.x = 0.68;
  ringB.rotation.x = Math.PI / 2;

  const group = new THREE.Group();
  group.add(ringA, ringB);
  group.rotation.set(0.35, -0.5, 0.25);
  scene.add(group);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key);

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // La souris et le défilement orientent doucement les anneaux
  const target = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  let rx = 0, ry = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    const scroll = Math.min(1, window.scrollY / window.innerHeight);
    rx += (target.y - rx) * 0.05;
    ry += (target.x - ry) * 0.05;
    group.rotation.x = 0.35 + rx + scroll * 0.6;
    group.rotation.y = -0.5 + ry + t * 0.12 + scroll * 1.2;
    group.position.y = Math.sin(t * 0.6) * 0.08 + scroll * 0.8;
    renderer.render(scene, camera);
  }
  frame();
  hero.classList.add('hero--3d');
}
setupHero3D();
