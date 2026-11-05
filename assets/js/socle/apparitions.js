/* Apparitions au défilement des éléments [data-anime] (hors data-anime="gsap", animés par le projet).
   Ils sont cachés par le style critique jusqu'à la classe .vu, qui les fait apparaître une fois,
   sans jamais les recacher. Les types de la bibliothèque (lignes, mots, cascade, rideau : effets.js)
   sont préparés juste avant .vu. En mode calme, en secours et au retour : tout est affiché directement. */
import { html } from './etat.js?v=2';
import { mesures } from './mesures.js?v=2';
import { preparerEntree, finirEntrees, decouperALAvance } from './effets.js?v=2';

let io = null;

export function toutAfficher() {
  html.classList.add('sans-transition');
  finirEntrees();
  document.querySelectorAll('[data-anime]').forEach((el) => {
    el.classList.add('vu');
    if (el.dataset.anime === 'gsap') { el.style.opacity = ''; el.style.transform = ''; }
  });
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('sans-transition')));
}

/* Préparation (rangs, fin de l'arrivée), puis .vu. Un texte découpé à l'instant attend deux images :
   son état de départ est affiché une fois, et la transition part bien de lui (aucune lecture de mise en page forcée). */
function reveler(el, delai = 0) {
  if (el.classList.contains('vu') || el.__revele) return;
  el.__revele = true;
  if (delai) el.style.setProperty('--delai', delai + 'ms');
  let frais = false;
  if (el.dataset.anime && el.dataset.anime !== 'gsap') {
    try { frais = preparerEntree(el); } catch (err) { console.error('[apparitions]', err); }
  }
  if (frais) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('vu')));
  else el.classList.add('vu');
}

export function demarrerApparitions() {
  if (io) return;
  /* Les textes à venir sont découpés à l'avance, pendant les temps morts, pas pendant le défilement. */
  try { decouperALAvance(); } catch (err) { console.error('[apparitions]', err); }
  const elements = [...document.querySelectorAll('[data-anime]:not([data-anime="gsap"]):not(.vu)')];
  if (!elements.length) return;
  io = new IntersectionObserver((entrees) => {
    const visibles = entrees.filter((e) => e.isIntersecting).map((e) => e.target);
    visibles.forEach((el, i) => {
      reveler(el, Math.min(i, 6) * 70);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 }); /* seuil 0 : même un très grand bloc apparaît */
  elements.forEach((el) => io.observe(el));
  /* En bas de page, ce qui reste dans les derniers 10 % de l'écran apparaît aussi. */
  const finDePage = () => {
    if (window.scrollY + window.innerHeight < (mesures.pageH || 0) - 4) return;
    document.querySelectorAll('[data-anime]:not([data-anime="gsap"]):not(.vu)').forEach((el) => { reveler(el); io.unobserve(el); });
  };
  window.addEventListener('scroll', finDePage, { passive: true });
  finDePage();
}
