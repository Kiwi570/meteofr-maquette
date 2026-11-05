/* MétéoFR : orchestration des pages. Le socle gère ouverture, voile, en-tête, menu, mode calme, boucles
   et bibliothèque d'effets ; ici : l'intro « jour-qui-se-lève », le ciel vivant et les données en direct. */
import { demarrer, etat } from './socle/index.js?v=1';
import * as M from './meteo.js?v=1';
import { CielVivant, figureCiel, rouleaux } from './ciel.js?v=1';
import { Radar } from './radar.js?v=1';
import * as E from './effets-meteo.js?v=1';
import { listeHeuresHTML, semainierHTML, majTexte, remplacerIcone } from './rendu.js?v=1';
import { pages } from './pages.js?v=1';

const gsap = window.gsap;
const page = document.documentElement.dataset.page;
const calme = () => etat.calme || !gsap;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Lieu courant : adresse (fiche commune), sinon dernier lieu choisi, sinon le relevé (Paris). */
const lieuInitial = M.lieuDeLAdresse() || M.lieuMemorise() || (M.releve && M.releve.lieu) || { nom: 'Paris', lat: 48.8534, lon: 2.3488, dep: '75' };

/* ---------- Intro « jour-qui-se-lève » ---------- */
const CLES = [ // altitude du soleil → couleurs du ciel (haut, milieu, bas)
  [-12, ['#040a1c', '#0a1a3a', '#13284f']], [-4, ['#141b45', '#4b3c74', '#c86a5a']], [3, ['#284a8e', '#c77f8a', '#f6b26b']],
  [12, ['#2f6fd1', '#6fa4e6', '#cfe3fb']], [40, ['#1f5fbf', '#4f8fe0', '#b8d7fa']],
];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function degrade(alt) {
  let a = CLES[0], b = CLES[CLES.length - 1];
  for (let i = 1; i < CLES.length; i++) if (alt <= CLES[i][0]) { a = CLES[i - 1]; b = CLES[i]; break; }
  const k = Math.max(0, Math.min(1, (alt - a[0]) / (b[0] - a[0] || 1)));
  const c = a[1].map((x, i) => { const p = hex(x), q = hex(b[1][i]); return `rgb(${p.map((v, j) => Math.round(v + (q[j] - v) * k)).join(' ')})`; });
  return `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 62%, ${c[2]} 100%)`;
}
function jouer() {
  if (!gsap) return null;
  const panneau = $('.ouverture-panneau');
  if (!panneau) return null;
  const heureEl = $('[data-intro-heure]', panneau), ciel = $('.intro-ciel', panneau), soleil = $('.intro-soleil', panneau);
  const n = M.maintenantParis(), cible = n.h * 60 + n.m, maintenant = Date.now();
  const alt = (min) => M.hauteurSoleil(new Date(maintenant - (cible - min) * 60000), lieuInitial.lat, lieuInitial.lon);
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
  const o = { m: 0 };
  const hauteur = (a) => -Math.max(-70, Math.min(90, a * 3));
  const peindre = () => {
    const a = alt(o.m);
    heureEl.textContent = fmt(o.m); ciel.style.background = degrade(a);
    soleil.style.transform = `translateY(${hauteur(a).toFixed(1)}px)`;
    soleil.style.opacity = a < -6 ? 0.35 : a < 0 ? 0.6 : 1;
  };
  peindre();
  const altFinale = alt(cible);
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.fromTo('.intro-rayons path', { strokeDasharray: 16, strokeDashoffset: 16 }, { strokeDashoffset: 0, duration: 0.45, stagger: 0.03 }, 0.05)
    .fromTo('.intro-disque', { attr: { r: 7 } }, { attr: { r: 20 }, duration: 0.6 }, 0)
    .fromTo('.intro-heure, .intro-ligne', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.08 }, 0.15)
    .to(o, { m: cible, duration: 1.05, ease: 'power2.inOut', onUpdate: peindre }, 0.4)
    .add(() => {
      const r = soleil.getBoundingClientRect();
      panneau.style.setProperty('--ix', `${r.left + r.width / 2}px`);
      panneau.style.setProperty('--iy', `${r.top + r.height / 2}px`);
    }, 1.62)
    .fromTo(panneau, { '--ir': '0px' }, { '--ir': `${Math.ceil(Math.hypot(innerWidth, innerHeight) * 1.1)}px`, duration: 0.75, ease: 'power2.in' }, 1.64);
  const p = pages[page];
  if (p && p.intro) p.intro(tl, 1.95, contexte);
  else if (page === 'accueil') introAccueil(tl, 1.95);
  return tl;
}

/* ---------- Accueil ---------- */
const contexte = { lieu: lieuInitial, modele: null };
let cielVivant = null, gir = null, crb = null, sem = null;

function paramsCiel(m) {
  const quand = m.direct ? new Date() : new Date(`${m.maj}:00+01:00`);
  const alt = M.hauteurSoleil(quand, m.lieu.lat, m.lieu.lon);
  return { etat: M.etatCiel(m.maintenant.code, m.maintenant.jour, alt), vent: m.maintenant.vent, dir: m.maintenant.dir, pluie: m.maintenant.pluie, nuages: m.maintenant.nuages };
}
export function changerPhoto(section, etatCiel) {
  if (!section || section.dataset.etat === etatCiel) return;
  section.dataset.etat = etatCiel;
  const fond = $('[data-ciel-fond]', section);
  const nouvelle = figureCiel(etatCiel);
  fond.appendChild(nouvelle);
  const img = $('img', nouvelle);
  const montrer = () => requestAnimationFrame(() => {
    nouvelle.classList.add('est-active');
    $$('.ciel-photo', fond).forEach((f) => { if (f !== nouvelle) { f.classList.remove('est-active'); setTimeout(() => f.remove(), 1400); } });
  });
  (img.decode ? img.decode() : Promise.resolve()).then(montrer, montrer);
}
function texte(cle, valeur) { $$(`[data-m="${cle}"]`).forEach((el) => { if (!el.hasAttribute('data-rouleaux')) el.textContent = valeur; }); }

function appliquerAccueil(m, { anime = true } = {}) {
  contexte.modele = m;
  const mt = m.maintenant, j0 = m.jours[0];
  texte('lieu', m.lieu.nom);
  texte('t', M.deg(mt.t));
  texte('libelle', M.libelle(mt.code));
  texte('ressenti', M.deg(mt.ressenti)); texte('tmin', M.deg(j0.tmin)); texte('tmax', M.deg(j0.tmax));
  texte('maj', majTexte(m.maj, m.direct));
  texte('source', 'données Open-Meteo');
  texte('dirTexte', M.ventDe(mt.dir));
  [['vent', mt.vent, 80], ['rafales', mt.rafales, 100], ['hum', mt.hum, 100], ['nuages', mt.nuages, 100], ['pluie', mt.pluie, 10], ['pression', mt.pression, null]].forEach(([k, v, mx]) => {
    texte(k, M.nombre(v));
    const b = $(`[data-jauge="${k}"]`);
    if (b) { const val = mx ? Math.min(1, v / mx) : Math.min(1, Math.max(0, (v - 980) / 60)); b.style.setProperty('--v', val); if (!calme() && b.__vu) gsap.to(b, { scaleX: val, duration: 0.8 }); else if (!calme() && gsap.getProperty(b, 'scaleX') !== 0) gsap.set(b, { scaleX: val }); }
  });
  const ciel = $('[data-ciel]');
  const lib = $('.ciel-libelle svg', ciel); remplacerIcone(lib, M.icone(mt.code, mt.jour));
  $$('.ea-lib svg').forEach((s) => remplacerIcone(s, M.icone(mt.code, mt.jour)));
  const p = paramsCiel(m);
  changerPhoto(ciel, p.etat);
  $$('[data-ecran-etat]').forEach((e) => { e.dataset.ecranEtat = p.etat; });
  cielVivant && cielVivant.regler(p);
  const temp = $('[data-rouleaux]', ciel);
  if (temp && temp.__pret) rouleaux(temp, M.deg(mt.t), { animer: anime });
  const fiche = $('[data-m-lien="fiche"]'); if (fiche) fiche.href = M.lienCommune(m.lieu);
  gir && gir.regler(mt.dir, mt.rafales);
  crb && crb.regler(m.heures);
  const lh = $('[data-heures]'); if (lh) lh.innerHTML = listeHeuresHTML(m.heures);
  if (sem) { const ts = m.jours.flatMap((j) => [j.tmin, j.tmax]); sem.regler(semainierHTML(m.jours), Math.min(...ts), Math.max(...ts)); }
}

async function chargerLieu(lieu, { annoncer = false } = {}) {
  const etatEl = $('[data-recherche-etat]');
  if (annoncer && etatEl) etatEl.textContent = `Chargement de la météo de ${lieu.nom}…`;
  const m = await M.previsions(lieu);
  if (!m) { if (etatEl && annoncer) etatEl.textContent = 'Données en direct indisponibles : le dernier relevé reste affiché.'; return null; }
  if (etatEl && annoncer) etatEl.textContent = `Météo de ${lieu.nom} affichée.`;
  appliquerAccueil(m, { anime: true });
  return m;
}

function introAccueil(tl, t) {
  const ciel = $('[data-ciel]');
  tl.fromTo('.ciel-ligne', { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.12 }, t - 0.1)
    .fromTo('.ciel-recherche', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, t + 0.1)
    .fromTo('.ciel-droite', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, t)
    .fromTo($('.ciel-fond', ciel), { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power2.out' }, t - 0.45)
    .add(() => { const temp = $('[data-rouleaux]', ciel); rouleaux(temp, M.deg((contexte.modele || M.releve).maintenant.t), { animer: true, duree: 0.8 }); }, t - 0.35);
}

function initAccueil() {
  const ciel = $('[data-ciel]');
  if (!ciel) return;
  /* Fond décoratif plein cadre : hors du test « tient dans l'écran » (contenus, légendes et commandes restent testés). */
  $$('.ciel-fond picture', ciel).forEach((p) => p.setAttribute('data-audit-ignorer', ''));
  contexte.modele = M.releve;
  cielVivant = new CielVivant($('[data-ciel-calque]', ciel));
  cielVivant.regler(paramsCiel(M.releve));
  const temp = $('[data-rouleaux]', ciel);
  rouleaux(temp, M.deg(M.releve.maintenant.t), { animer: false }); temp.__pret = true;
  gir = E.girouette($('[data-effet="girouette"]'));
  E.jauges($('[data-effet="jauges"]'));
  if (!calme()) $$('[data-jauge]').forEach((b) => window.ScrollTrigger && window.ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: () => { b.__vu = true; } }));
  crb = E.courbe($('[data-courbe]'));
  crb.regler(M.releve.heures);
  E.vagueVigilance($('.france--vigilance'));
  sem = E.semainier($('[data-semainier]'), $$('[data-filtres-jours] button'));
  E.telephone($('[data-telephone]'));
  E.isobares($('[data-effet="isobares"]'));
  initRadarDefile($('[data-radar]'));
  initVilles();
  releveInfo();
  /* Ciel vivant au défilement : l'horizon descend, le ciel s'ouvre, le texte s'éloigne. */
  if (!calme()) {
    gsap.to($('.ciel-fond', ciel), { yPercent: 16, ease: 'none', scrollTrigger: { trigger: ciel, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to($('.ciel-calque', ciel), { yPercent: -8, ease: 'none', scrollTrigger: { trigger: ciel, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to($('.ciel-contenu', ciel), { y: -70, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: ciel, start: 'center center', end: 'bottom top', scrub: true } });
  }
  E.initRecherche($('#recherche'), { surChoix: (l) => { M.memoriserLieu(l); contexte.lieu = l; chargerLieu(l, { annoncer: true }); } });
  chargerLieu(lieuInitial);
}

/* Relevé de vigilance passé : signalé comme tel. */
function releveInfo() {
  const v = M.vigilance; if (!v) return;
  if (M.maintenantParis().date > v.releve.slice(0, 10)) $$('[data-releve-passe]').forEach((e) => { e.hidden = false; });
}

function initRadarDefile(sec) {
  if (!sec) return;
  const radar = new Radar($('.radar-scene', sec), { etiquette: $('[data-radar-heure]', sec), progres: $('[data-radar-progres]', sec), message: $('[data-radar-message]', sec) });
  let progres = 1;
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); radar.charger().then(() => radar.dessiner(progres * (radar.images.length - 1), true)); } }, { rootMargin: '600px 0px' });
  io.observe(sec);
  if (calme()) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px) and (min-height: 500px)', () => {
    window.ScrollTrigger.create({ trigger: sec, start: 'top top', end: '+=110%', pin: true, scrub: true, invalidateOnRefresh: true, onUpdate: (s) => { progres = s.progress; radar.dessiner(s.progress * (radar.images.length - 1)); } });
  });
  mm.add('(max-width: 760px), (max-height: 499px)', () => {
    window.ScrollTrigger.create({ trigger: sec, start: 'top 75%', end: 'bottom 25%', scrub: true, onUpdate: (s) => { progres = s.progress; radar.dessiner(s.progress * (radar.images.length - 1)); } });
  });
  gsap.fromTo($('.radar-scene .france', sec), { scale: 0.9, opacity: 0.4 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } });
}

function initVilles() {
  const cartes = $$('[data-ville]');
  if (!cartes.length) return;
  const etatDe = (a) => M.etatCiel(+a.dataset.code, +a.dataset.jour);
  E.miniCiels(cartes, etatDe);
  M.villesEnDirect(cartes.map((a) => ({ nom: a.dataset.ville, lat: +a.dataset.lat, lon: +a.dataset.lon }))).then((r) => {
    if (!r) return;
    r.forEach((v, i) => {
      const a = cartes[i];
      a.dataset.code = v.code; a.dataset.jour = v.jour; a.dataset.t = v.t;
      a.querySelector('[data-v="t"]').textContent = M.deg(v.t);
      a.querySelector('[data-v="libelle"]').textContent = M.libelle(v.code);
      remplacerIcone(a.querySelector('.ville-libelle svg'), M.icone(v.code, v.jour));
      if (v.matin) a.querySelector('[data-v="matin"]').textContent = M.deg(v.matin[0]);
      if (v.aprem) a.querySelector('[data-v="aprem"]').textContent = M.deg(v.aprem[0]);
      a.__peindre && a.__peindre();
    });
  });
}

/* ---------- Démarrage ---------- */
demarrer({
  preparer() {
    if (page === 'accueil') initAccueil();
    if (page === '404') E.brouillard($('[data-brume]'));
    const p = pages[page];
    if (p && p.preparer) p.preparer(contexte);
    $$('[data-recherche]').forEach((f) => E.initRecherche(f));
  },
  jouer,
  etatFinal() {
    $$('[data-anime="gsap"]').forEach((el) => { el.classList.add('vu'); if (gsap) gsap.set(el, { clearProps: 'transform,opacity' }); });
    const p = pages[page]; if (p && p.etatFinal) p.etatFinal(contexte);
  },
  arrivee() {
    if (!gsap) return;
    const p = pages[page];
    if (p && p.arrivee) { p.arrivee(contexte); return; }
    if (page === 'accueil') {
      const tl = gsap.timeline({ delay: 0.1 });
      introAccueil(tl, 0.15);
    }
  },
});
