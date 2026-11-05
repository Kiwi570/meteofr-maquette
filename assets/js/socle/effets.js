/* Bibliothèque d'effets prêts à l'emploi : testés avec le mode calme, le retour arrière, le téléphone et l'audit.
   Le projet les pose par des attributs dans ses pages et ne les réécrit pas ; il garde site.js pour ses effets propres.

   1. Apparitions au défilement, jouées une fois (comme data-anime, déclenchées par apparitions.js) :
      data-anime="lignes"   titre découpé en lignes qui montent de leur masque (accents et jambages jamais coupés)
      data-anime="mots"     texte qui arrive mot par mot
      data-anime="cascade"  enfants directs (cartes, liste) qui arrivent l'un après l'autre
      data-anime="rideau"   image (figure .media) révélée par un rideau, l'image se resserre
   2. Effets liés au défilement :
      data-fx="parallaxe"   image qui glisse dans son cadre (data-fx-force = déplacement en %, 10 par défaut ; bords jamais visibles)
      data-fx="zoom"        image qui se resserre pendant qu'elle entre dans l'écran
      data-fx="trace"       traits SVG qui se dessinent au défilement et finissent tracés en entier
      data-fx="galerie"     section épinglée dont la piste [data-galerie] défile à l'horizontale (761 px et plus)
      data-fx="onde"        image WebGL qui ondule selon la vitesse de défilement, loupe douce sous la souris (onde.js)
   3. Effets au survol, souris seulement (ils ne comptent jamais comme effets de section) :
      data-survol="magnetique"  bouton attiré par la souris
      data-survol="incline"     carte qui s'incline en 3D

   Les familles 1 et 2 reçoivent data-effet (s'il manque) : l'audit les compte comme effets de leur section.
   Les effets qui suivent la souris reçoivent data-souris : l'audit vérifie qu'ils se stabilisent quand elle s'arrête.
   Un effet présent dans le premier écran (trait, zoom) se joue après l'ouverture, dans le temps.
   Mode calme, secours, retour arrière, retour à la section : rien ne bouge à l'arrivée, tout est dans son état final.
   Sans JavaScript : contenu normal. Aucune lecture de mise en page pendant le défilement : les textes sont découpés
   à l'avance, pendant les temps morts, et rétablis quand le défilement s'arrête. */
import { html, etat, quand, stockage } from './etat.js?v=1';

const ENTREES = ['lignes', 'mots', 'cascade', 'rideau'];
const decoupes = new Set();
const sourisFine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
/* Nœuds « vivants » : un texte qui en contient n'est jamais découpé (le rétablir les remplacerait). Simple fondu. */
const VIVANTS = '[data-compteur], [data-anime], [data-effet], [data-survol], [data-fx], a, button, input, select, textarea, video, canvas';

/* ---------- 1. Apparitions : découpe à l'avance, rétablissement à l'arrêt du défilement ---------- */

let dernierDefilement = 0;
window.addEventListener('scroll', () => { dernierDefilement = performance.now(); }, { passive: true });
const quandImmobile = (fn) => {
  const essai = () => (performance.now() - dernierDefilement > 220 ? fn() : setTimeout(essai, 150));
  essai();
};
const temps = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 60));

function decoupable(el) {
  return (el.dataset.anime === 'lignes' || el.dataset.anime === 'mots') && window.SplitText && !el.querySelector(VIVANTS);
}

function decouper(el) {
  if (el.__decoupe || el.classList.contains('vu') || !decoupable(el)) return;
  const lignes = el.dataset.anime === 'lignes';
  let d = null;
  try {
    d = lignes ? new window.SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'fx-ligne' }) : new window.SplitText(el, { type: 'words', wordsClass: 'fx-mot' });
  } catch (err) { console.error('[effets] découpe', err); return; }
  const morceaux = (lignes ? d.lines : d.words) || [];
  morceaux.forEach((m, i) => m.style.setProperty('--i', Math.min(i, 14)));
  el.__decoupe = d;
  el.__morceaux = morceaux;
  decoupes.add(el);
}

function defaire(el) {
  if (!el.__decoupe) return;
  try { el.__decoupe.revert(); } catch {}
  el.__decoupe = null;
  el.__morceaux = null;
  decoupes.delete(el);
}

/* Découpe à l'avance, pendant les temps morts, de tous les textes encore à venir ; nouvelle découpe au redimensionnement. */
let attente = [];
function suivant() {
  const el = attente.shift();
  if (!el) return;
  decouper(el);
  temps(suivant);
}
export function decouperALAvance() {
  if (etat.calme) return;
  attente = [...document.querySelectorAll('[data-anime="lignes"]:not(.vu), [data-anime="mots"]:not(.vu)')];
  temps(suivant);
  let t = 0, largeur = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (window.innerWidth === largeur) return;
      largeur = window.innerWidth;
      decoupes.forEach((el) => { if (!el.classList.contains('vu')) defaire(el); });
      attente = [...document.querySelectorAll('[data-anime="lignes"]:not(.vu), [data-anime="mots"]:not(.vu)')];
      temps(suivant);
    }, 250);
  });
}

/* Appelé juste avant l'ajout de .vu. Retourne vrai si l'élément doit attendre deux images avant .vu
   (découpe faite à l'instant : l'état de départ doit être affiché une fois pour que la transition parte de lui). */
export function preparerEntree(el) {
  const type = el.dataset.anime;
  let frais = false;
  if (type === 'lignes' || type === 'mots') {
    if (!el.__decoupe && decoupable(el)) decouper(el);
    if (el.__decoupe) {
      /* Fin de l'arrivée : dernier morceau arrivé (transitionend), avec un délai de secours, puis texte normal
         rétabli quand le défilement est arrêté (aucun saut : les masques ne changent pas la hauteur). */
      const dernier = el.__morceaux[el.__morceaux.length - 1];
      let fini = false;
      const finir = () => { if (fini) return; fini = true; quandImmobile(() => defaire(el)); };
      if (dernier) dernier.addEventListener('transitionend', (e) => { if (e.target === dernier && e.propertyName === 'transform') finir(); });
      setTimeout(finir, 4000);
      /* Toujours deux images avant .vu : l'état de départ des morceaux est affiché au moins une fois. */
      frais = true;
    }
  } else if (type === 'cascade') {
    const enfants = [...el.children];
    enfants.forEach((c, i) => c.style.setProperty('--i', Math.min(i, 10)));
    /* Après l'arrivée, la transition de la cascade s'efface : les transitions du projet reprennent la main. */
    const dernier = enfants[Math.min(enfants.length, 11) - 1];
    let fini = false;
    const finir = () => { if (!fini) { fini = true; el.classList.add('fx-fini'); } };
    if (dernier) dernier.addEventListener('transitionend', (e) => { if (e.target === dernier) finir(); });
    setTimeout(finir, 2600);
  } else if (type === 'rideau') {
    setTimeout(() => el.classList.add('fx-fini'), 2400);
  }
  return frais;
}

/* État final immédiat (retour arrière, mode calme, secours) : tout texte découpé redevient normal. */
export function finirEntrees() {
  attente = [];
  decoupes.forEach(defaire);
  document.querySelectorAll('[data-anime="cascade"], [data-anime="rideau"]').forEach((el) => el.classList.add('fx-fini'));
}

/* ---------- Repères lus par l'audit ---------- */

function marquer() {
  document.querySelectorAll(ENTREES.map((t) => `[data-anime="${t}"]`).join(',')).forEach((el) => {
    if (!el.dataset.effet) el.dataset.effet = el.dataset.anime;
  });
  document.querySelectorAll('[data-fx]').forEach((el) => { if (!el.dataset.effet) el.dataset.effet = el.dataset.fx; });
}

/* ---------- 2. Effets liés au défilement ---------- */

/* Arrivée sans voile ni intro (retour rechargé, retour à la section) : la page est déjà peinte, rien ne doit changer. */
function arriveeDejaPeinte() {
  if (etat.arrivee === 'retour') return true;
  try { return !!(stockage() && stockage().getItem('socle:calme-retour')); } catch { return false; }
}

function cibleImage(el) {
  return el.querySelector('[data-fx-cible]') || el.querySelector(':scope > picture, :scope > video, :scope > img, :scope > svg') || el.firstElementChild;
}

/* Élément déjà dans le premier écran au démarrage : joué dans le temps après l'ouverture (jamais bloqué). */
function premierEcran(el) {
  return el.getBoundingClientRect().top + window.scrollY < window.innerHeight * 0.85;
}

/* Joue une animation après l'ouverture (intro ou voile), ou la met directement dans son état final. */
function apresOuverture(tl) {
  quand('pret', ({ mode }) => {
    if (mode === 'jouee' || mode === 'voile') tl.play(0);
    else tl.progress(1);
  });
  quand('retour', () => tl.progress(1));
}

/* Défilement trop court pour atteindre la fin (élément en bas de page) : état final. */
const terminerSiCourt = (st) => { if (st.end - st.start < 2 && st.animation) st.animation.progress(1); };

function parallaxe(el, gsap) {
  const cible = cibleImage(el);
  if (!cible) return;
  const f = Math.min(25, Math.max(2, parseFloat(el.dataset.fxForce) || 10));
  /* Agrandie d'au moins son déplacement : le bord de l'image n'est jamais visible. */
  const s = 1 + (2 * f) / 100 + 0.02;
  gsap.fromTo(cible, { yPercent: -f, scale: s }, {
    yPercent: f, scale: s, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

function zoom(el, gsap) {
  const cible = cibleImage(el);
  if (!cible) return;
  const s = 1 + Math.min(0.4, Math.max(0.05, (parseFloat(el.dataset.fxForce) || 18) / 100));
  if (premierEcran(el)) {
    apresOuverture(gsap.fromTo(cible, { scale: s }, { scale: 1, duration: 1.6, ease: 'power3.out', paused: true }));
    return;
  }
  gsap.fromTo(cible, { scale: s }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: el, start: 'clamp(top bottom)', end: 'clamp(center center)', scrub: 0.4, onRefresh: terminerSiCourt },
  });
}

function trace(el, gsap) {
  const choisis = el.querySelectorAll('[data-fx-trait]');
  /* Les traits déjà en pointillés gardent leurs pointillés : ils ne sont pas tracés. */
  const traits = [...(choisis.length ? choisis : el.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect'))]
    .filter((t) => { const s = getComputedStyle(t); return s.stroke && s.stroke !== 'none' && (!s.strokeDasharray || s.strokeDasharray === 'none'); });
  if (!traits.length) return;
  /* Longueur 1, trou un peu plus long que le trait : aucun point visible au départ, même avec des bouts arrondis. */
  traits.forEach((t) => {
    t.setAttribute('pathLength', '1');
    t.style.strokeDasharray = '1 1.2';
    t.style.strokeDashoffset = '1.1';
  });
  const etapes = { strokeDashoffset: 0, ease: 'none', duration: 1, stagger: traits.length > 1 ? 0.6 / (traits.length - 1) : 0 };
  if (premierEcran(el)) {
    apresOuverture(gsap.timeline({ paused: true }).to(traits, { ...etapes, duration: 0.9, ease: 'power2.inOut' }));
    return;
  }
  /* clamp() : même en bas de page, le défilement atteint la fin, et les traits finissent tracés en entier. */
  gsap.timeline({ scrollTrigger: { trigger: el, start: 'clamp(top 85%)', end: 'clamp(bottom 45%)', scrub: 0.5, onRefresh: terminerSiCourt } })
    .to(traits, etapes);
}

function galerie(el, gsap) {
  const piste = el.querySelector('[data-galerie]');
  if (!piste) return;
  const barre = el.querySelector('[data-fx-progres]') || el.querySelector('.galerie-progres span');
  gsap.matchMedia().add('(min-width: 761px)', () => {
    /* Épinglée, la piste ne défile plus d'elle-même : elle sort de la tabulation et n'est plus une région
       (elle le redevient en mode calme, sans JavaScript et sur téléphone, où elle défile à l'horizontale). */
    const garde = ['tabindex', 'role', 'aria-label'].map((a) => [a, piste.getAttribute(a)]);
    garde.forEach(([a]) => piste.removeAttribute(a));
    /* Largeur utile sans la barre de défilement : la dernière carte s'arrête bien au bord. */
    const distance = () => Math.max(0, piste.scrollWidth - document.documentElement.clientWidth);
    const tw = gsap.fromTo(piste, { x: 0 }, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: el, start: 'top top', end: () => '+=' + distance(), pin: true, anticipatePin: 1, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: (st) => { if (barre) barre.style.transform = `scaleX(${st.progress})`; },
      },
    });
    /* Au clavier : une carte hors écran qui reçoit le focus est ramenée à l'écran. */
    const focus = (e) => {
      const st = tw.scrollTrigger, carte = [...piste.children].find((c) => c.contains(e.target));
      if (!st || !carte || !distance()) return;
      const p = Math.min(1, Math.max(0, (carte.offsetLeft - 40) / distance()));
      window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: 'instant' });
    };
    piste.addEventListener('focusin', focus);
    return () => {
      piste.removeEventListener('focusin', focus);
      garde.forEach(([a, v]) => { if (v !== null) piste.setAttribute(a, v); });
    };
  });
}

/* ---------- 3. Effets au survol (souris seulement) ---------- */

/* Préparés au premier survol, une fois l'élément arrivé : GSAP prend alors la main sur sa transformation
   (classe fx-survol : plus de transition CSS sur transform), sans figer une position de départ. */
function auPremierSurvol(el, monter) {
  let pret = null;
  el.addEventListener('pointerenter', () => {
    if (pret || el.closest('[data-anime]:not(.vu)')) return;
    el.classList.add('fx-survol');
    pret = monter();
  });
  return (fn) => (...a) => pret && fn(pret, ...a);
}

function survol(gsap) {
  if (!sourisFine()) return;
  document.querySelectorAll('[data-survol="magnetique"]').forEach((el) => {
    el.dataset.souris = '';
    const avec = auPremierSurvol(el, () => ({
      x: gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' }),
    }));
    let raf = 0, dernier = null;
    el.addEventListener('pointermove', avec((q, e) => {
      dernier = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        q.x((dernier.clientX - r.left - r.width / 2) * 0.28);
        q.y((dernier.clientY - r.top - r.height / 2) * 0.36);
      });
    }));
    el.addEventListener('pointerleave', avec((q) => { cancelAnimationFrame(raf); raf = 0; q.x(0); q.y(0); }));
  });
  document.querySelectorAll('[data-survol="incline"]').forEach((el) => {
    el.dataset.souris = '';
    const max = parseFloat(el.dataset.survolForce) || 7;
    const avec = auPremierSurvol(el, () => {
      gsap.set(el, { transformPerspective: 900 });
      return {
        rx: gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' }),
        ry: gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' }),
      };
    });
    let raf = 0, dernier = null;
    el.addEventListener('pointermove', avec((q, e) => {
      dernier = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const px = (dernier.clientX - r.left) / r.width - 0.5, py = (dernier.clientY - r.top) / r.height - 0.5;
        q.ry(px * max * 2); q.rx(-py * max * 2);
      });
    }));
    el.addEventListener('pointerleave', avec((q) => { cancelAnimationFrame(raf); raf = 0; q.rx(0); q.ry(0); }));
  });
}

/* ---------- Démarrage (appelé par le socle avant la préparation du projet) ---------- */

/* Retourne une promesse « effets prêts » (shaders compilés, textures envoyées), attendue par l'ouverture. */
export function initEffets() {
  marquer();
  if (etat.calme || html.classList.contains('secours')) return Promise.resolve();
  const gsap = window.gsap;
  if (!gsap || !window.ScrollTrigger) return Promise.resolve();
  const faire = (sel, fn) => document.querySelectorAll(sel).forEach((el) => { try { fn(el, gsap); } catch (err) { console.error('[effets]', sel, err); } });
  /* Page déjà peinte à l'arrivée : ni trait caché, ni image agrandie d'un coup. */
  if (!arriveeDejaPeinte()) {
    faire('[data-fx="parallaxe"]', parallaxe);
    faire('[data-fx="zoom"]', zoom);
    faire('[data-fx="trace"]', trace);
  }
  faire('[data-fx="galerie"]', galerie);
  try { survol(gsap); } catch (err) { console.error('[effets] survol', err); }
  if (document.querySelector('[data-fx="onde"]')) {
    return import('./onde.js?v=1').then((m) => m.initOnde()).catch((err) => console.error('[effets] onde', err));
  }
  return Promise.resolve();
}
