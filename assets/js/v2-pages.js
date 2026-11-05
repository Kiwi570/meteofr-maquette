/* Effets v2 des pages intérieures (Ma commune, Radar, Vigilance, Application, Contact, 404).
   Mode calme : état final direct, aucune boucle. Sans WebGL : la photo seule. */
import { boucle, etat as socle } from './socle/index.js?v=2';
import * as M from './meteo.js?v=2';
import { glPlein, imageDe } from './gl.js?v=2';
import { degradeCiel } from './v2-accueil.js?v=2';

const gsap = () => window.gsap;
const ST = () => window.ScrollTrigger;
const calme = () => socle.calme || !gsap();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const BRUIT = `float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 cover(vec2 uv, vec2 r, vec2 ri, vec2 foc){ float rs = r.x / r.y, rim = ri.x / ri.y;
  vec2 e = rs < rim ? vec2(rs / rim, 1.0) : vec2(1.0, rim / rs); vec2 f = vec2(foc.x, 1.0 - foc.y);
  return (uv - 0.5) * e + 0.5 + (f - 0.5) * (1.0 - e); }`;

/* Photo animée en WebGL posée sur une figure .media : renvoie le contrôleur ou null. */
async function photoVivante(fig, frag, { echelle = 0.75, foc = [0.5, 0.5] } = {}) {
  if (!fig || calme()) return null;
  const img = $('img', fig);
  if (!(await imageDe(img))) return null;
  const cv = document.createElement('canvas'); cv.className = 'photo-gl'; cv.setAttribute('aria-hidden', 'true');
  fig.appendChild(cv);
  const g = glPlein(cv, frag, { echelle });
  if (!g) { cv.remove(); return null; }
  g.texture('img', img); g.set('ri', img.naturalWidth, img.naturalHeight); g.set('foc', foc[0], foc[1]);
  fig.classList.add('a-gl');
  return g;
}

/* ================= Ma commune ================= */
const FRAG_HERBES = `precision mediump float;
uniform vec2 r; uniform float t; uniform sampler2D img; uniform vec2 ri; uniform vec2 foc; uniform float force; uniform float sens;
${BRUIT}
void main(){
  vec2 st = cover(gl_FragCoord.xy / r, r, ri, foc);
  float herbe = 1.0 - smoothstep(0.32, 0.6, st.y);
  float vague = n(vec2(st.x * 5.0 - t * sens * (0.7 + force), st.y * 2.5)) - 0.5;
  float rafale = 0.55 + 0.45 * sin(st.x * 2.6 - t * sens * 1.1);
  st.x += vague * herbe * force * 0.02 * rafale;
  st.y -= abs(vague) * herbe * force * 0.004;
  float ciel = smoothstep(0.55, 0.9, st.y);
  st.x += (n(vec2(st.x * 2.0 - t * 0.05 * sens, st.y * 2.0)) - 0.5) * ciel * 0.004;
  gl_FragColor = texture2D(img, st);
}`;
/** Les herbes ondulent à la force du vent réel, dans son sens. */
export async function herbes(fig) {
  const v = { force: 0.6, sens: 1 };
  const g = await photoVivante(fig, FRAG_HERBES, { foc: [0.3, 0.6] });
  if (g) boucle(fig, (dt, t) => { g.set('t', t); g.set('force', v.force); g.set('sens', v.sens); g.dessiner(); }, { lourde: true });
  return { regler(vent, dir) { v.force = Math.max(0.25, Math.min(1.7, (vent || 8) / 26)); v.sens = Math.sin(((dir ?? 270) + 180) * Math.PI / 180) >= 0 ? 1 : -1; } };
}

/** Le soleil parcourt son arc au défilement, le ciel de la section change de couleur, les étoiles s'allument. */
export function coucher(sec, { lieu, jour }) {
  if (!sec) return { regler() {} };
  const svg = $('[data-arc] svg', sec), soleil = $('[data-arc-soleil]', sec), ciel = $('[data-soleil-ciel]', sec), etoiles = $('[data-soleil-etoiles]', sec);
  const heure = $('[data-arc-heure]', sec), repere = $('[data-arc-maintenant]', sec);
  let L = lieu, J = jour, k = 0;
  const mn = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const poser = () => {
    if (!J) return;
    const lev = mn(J.lever), cou = mn(J.coucher);
    const minutes = lev + (cou - lev) * Math.min(1, k) + Math.max(0, k - 1) * 90;
    const a = Math.PI * (1 - Math.min(1, k));
    soleil.setAttribute('cx', (300 + Math.cos(a) * 240).toFixed(1));
    soleil.setAttribute('cy', (260 - Math.sin(a) * 220 + Math.max(0, k - 1) * 260).toFixed(1));
    const d = new Date(`${J.date}T${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(Math.round(minutes % 60)).padStart(2, '0')}:00+01:00`);
    const alt = M.hauteurSoleil(d, L.lat, L.lon);
    if (ciel) ciel.style.background = degradeCiel(alt);
    if (etoiles) etoiles.style.opacity = alt < -4 ? Math.min(1, (-alt - 4) / 6).toFixed(2) : 0;
    if (heure) heure.textContent = M.heureFr(`${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(Math.round(minutes % 60) % 60).padStart(2, '0')}`);
  };
  const placerRepere = () => {
    if (!J || !repere) return;
    const n = M.maintenantParis(), lev = mn(J.lever), cou = mn(J.coucher), now = n.h * 60 + n.m;
    const kk = Math.max(0, Math.min(1, (now - lev) / (cou - lev)));
    const a = Math.PI * (1 - kk);
    repere.setAttribute('transform', `translate(${(300 + Math.cos(a) * 240).toFixed(1)} ${(260 - Math.sin(a) * 220).toFixed(1)})`);
    repere.style.opacity = now < lev || now > cou ? 0 : 1;
  };
  if (calme()) { k = 0.5; poser(); placerRepere(); return { regler(l, j) { L = l; J = j; poser(); placerRepere(); } }; }
  poser(); placerRepere();
  ST().create({ trigger: sec, start: 'top 75%', end: 'bottom 35%', scrub: 0.6, onUpdate: (s) => { k = s.progress * 1.18; poser(); } });
  return { regler(l, j) { L = l; J = j; poser(); placerRepere(); } };
}

/** Travelling de la France entière vers le département, au défilement. */
export function zoomDepartement(svg, sec) {
  let tw = null;
  return (vb, plein) => {
    if (tw) { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); tw = null; }
    if (calme()) { svg.setAttribute('viewBox', vb); return; }
    svg.setAttribute('viewBox', plein);
    tw = gsap().fromTo(svg, { attr: { viewBox: plein } }, { attr: { viewBox: vb }, ease: 'power2.inOut', scrollTrigger: { trigger: sec, start: 'top 80%', end: 'center 50%', scrub: 0.7 } });
  };
}

/* ================= Radar & carte ================= */
const ECHELLE_T = [[-10, [59, 76, 192]], [0, [96, 150, 226]], [8, [120, 196, 214]], [14, [166, 214, 160]], [18, [246, 211, 107]], [24, [246, 164, 58]], [32, [211, 58, 44]]];
function teinteRGB(t) {
  if (t <= ECHELLE_T[0][0]) return ECHELLE_T[0][1];
  for (let i = 1; i < ECHELLE_T.length; i++) {
    const [b, cb] = ECHELLE_T[i], [a, ca] = ECHELLE_T[i - 1];
    if (t <= b) { const k = (t - a) / (b - a); return ca.map((v, j) => v + (cb[j] - v) * k); }
  }
  return ECHELLE_T[ECHELLE_T.length - 1][1];
}
/** Carte de chaleur : la température interpolée entre les vingt villes, découpée sur la France. */
export function carteChaleur(carte) {
  const cv = carte && $('[data-chaleur]', carte);
  if (!cv) return { regler() {} };
  const ctx = cv.getContext('2d'), svg = $('svg.france', carte);
  const vb = svg.viewBox.baseVal, chemins = $$('.dep', svg).map((p) => new Path2D(p.getAttribute('d')));
  const masque = document.createElement('canvas'), mc = masque.getContext('2d');
  let W = 0, H = 0, actuel = null, moment = 'direct', anim = null;
  const points = () => $$('.marqueur', carte).map((a) => {
    const [t] = (a.dataset[moment] || '').split('|');
    return { x: parseFloat(a.style.getPropertyValue('--x')) / 100 * W, y: parseFloat(a.style.getPropertyValue('--y')) / 100 * H, t: +t };
  }).filter((p) => Number.isFinite(p.t));
  const champ = () => {
    const pts = points(), out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, sw = 0;
      for (const p of pts) { const d2 = (p.x - x) ** 2 + (p.y - y) ** 2 + 1; const w = 1 / (d2 * d2); s += w * p.t; sw += w; }
      out[y * W + x] = s / sw;
    }
    return out;
  };
  const peindre = (f) => {
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) { const c = teinteRGB(f[i]); img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 235; }
    ctx.putImageData(img, 0, 0);
    ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(masque, 0, 0); ctx.globalCompositeOperation = 'source-over';
  };
  const mesurer = () => {
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    W = cv.width = masque.width = Math.max(40, Math.round(r.width / 3)); H = cv.height = masque.height = Math.max(40, Math.round(r.height / 3));
    mc.clearRect(0, 0, W, H); mc.save(); mc.scale(W / vb.width, H / vb.height); mc.fillStyle = '#000'; chemins.forEach((p) => mc.fill(p)); mc.restore();
    actuel = champ(); peindre(actuel);
  };
  new ResizeObserver(mesurer).observe(cv);
  return {
    regler(m) {
      moment = m || moment;
      if (!W) { mesurer(); return; }
      const cible = champ();
      if (calme() || !actuel) { actuel = cible; peindre(actuel); return; }
      const depart = actuel.slice(), o = { k: 0 };
      anim && anim.kill();
      anim = gsap().to(o, { k: 1, duration: 0.8, ease: 'power2.inOut', onUpdate: () => { for (let i = 0; i < depart.length; i++) actuel[i] = depart[i] + (cible[i] - depart[i]) * o.k; peindre(actuel); } });
    },
  };
}

/** Averse en marche : au défilement, une averse traverse la carte ; la légende et les conseils s'allument à son passage. */
export function averse(sec) {
  const scene = sec && $('[data-averse]', sec);
  if (!scene) return;
  const cel = $('[data-cellule]', scene), forte = $('.ac-forte', scene), moderee = $('.ac-moderee', scene), heure = $('[data-averse-heure]', scene);
  const curseur = $('[data-echelle-curseur]', sec), conseils = $$('.conseils li', sec), niveaux = $$('[data-niveau]', sec);
  const poser = (p) => {
    const x = 8 + p * 74, y = 58 - Math.sin(p * Math.PI) * 14 - p * 6;
    const I = Math.sin(Math.min(1, p * 1.15) * Math.PI);
    cel.style.transform = `translate(${x.toFixed(2)}%, ${y.toFixed(2)}%) translate(-50%, -50%) rotate(${(-18 + p * 20).toFixed(1)}deg) scale(${(0.7 + I * 0.5).toFixed(3)})`;
    forte.style.opacity = Math.max(0, (I - 0.55) / 0.45).toFixed(3);
    moderee.style.opacity = Math.max(0, (I - 0.15) / 0.6).toFixed(3);
    if (curseur) curseur.style.left = `${(I * 100).toFixed(1)}%`;
    const n = I > 0.75 ? 2 : I > 0.35 ? 1 : 0;
    niveaux.forEach((el, i) => el.classList.toggle('est-active', i === n));
    conseils.forEach((li, i) => li.classList.toggle('est-active', i === Math.min(2, Math.floor(p * 3))));
    if (heure) { const min = Math.round((p - 1) * 120 / 10) * 10; heure.textContent = min === 0 ? 'maintenant' : `il y a ${-min >= 60 ? `${Math.floor(-min / 60)} h${-min % 60 ? ` ${-min % 60}` : ''}` : `${-min} min`}`; }
  };
  if (calme()) { poser(0.55); conseils.forEach((li) => li.classList.add('est-active')); return; }
  poser(0);
  ST().create({ trigger: sec, start: 'top 70%', end: 'bottom 40%', scrub: 0.6, onUpdate: (s) => poser(s.progress) });
}

/* ================= Vigilance ================= */
/** Survol d'un département : sa ligne s'allume dans la liste, et inversement. */
export function survolVigilance(svg, listes) {
  if (!svg) return;
  const items = () => $$('.vig-item', listes).filter((li) => !li.closest('[hidden]'));
  const codesDe = (li) => [...li.textContent.matchAll(/\((\d[\dAB]|\d{2,3})\)/g)].map((m) => m[1]);
  const eteindre = () => { $$('.surligne', svg).forEach((p) => p.classList.remove('surligne')); $$('.vig-item.surligne', listes).forEach((li) => li.classList.remove('surligne')); };
  svg.addEventListener('pointerover', (e) => {
    const p = e.target.closest('.dep'); eteindre(); if (!p || !/dep--/.test(p.getAttribute('class'))) return;
    p.classList.add('surligne'); items().forEach((li) => { if (codesDe(li).includes(p.dataset.dep)) li.classList.add('surligne'); });
  });
  svg.addEventListener('pointerleave', eteindre);
  listes.addEventListener('pointerover', (e) => {
    const li = e.target.closest('.vig-item'); eteindre(); if (!li) return;
    li.classList.add('surligne'); codesDe(li).forEach((c) => { const p = svg.querySelector(`[data-dep="${c}"]`); if (p) p.classList.add('surligne'); });
  });
  listes.addEventListener('pointerleave', eteindre);
}

const FRAG_EAU = `precision mediump float;
uniform vec2 r; uniform float t; uniform sampler2D img; uniform vec2 ri; uniform vec2 foc; uniform float niveau;
${BRUIT}
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float bord = niveau + (n(vec2(uv.x * 6.0 + t * 0.6, t * 0.3)) - 0.5) * 0.035 + sin(uv.x * 18.0 + t * 2.2) * 0.006;
  float dessous = 1.0 - smoothstep(bord - 0.004, bord + 0.004, uv.y);
  vec2 dec = vec2(n(uv * vec2(9.0, 22.0) + vec2(t * 0.5, -t * 0.8)) - 0.5, n(uv * vec2(14.0, 9.0) - vec2(t * 0.4, t * 0.3)) - 0.5);
  vec2 st = cover(uv + dec * 0.022 * dessous + vec2(0.0, sin(uv.x * 30.0 + t * 3.0) * 0.0015), r, ri, foc);
  vec4 c = texture2D(img, st);
  vec3 eau = mix(c.rgb, vec3(0.32, 0.36, 0.3), 0.32 * dessous);
  float reflet = pow(max(0.0, n(uv * vec2(40.0, 70.0) + vec2(t * 0.6, t * 1.4)) - 0.62), 2.0) * 3.0 * dessous;
  float ligne = (1.0 - smoothstep(0.0, 0.012, abs(uv.y - bord))) * 0.55;
  gl_FragColor = vec4(eau + reflet + ligne, 1.0);
}`;
/** Crue sous l'eau : la photo vue à travers une eau qui bouge, le niveau monte au défilement. */
export async function crue(fig, sec) {
  const g = await photoVivante(fig, FRAG_EAU, { foc: [0.5, 0.55], echelle: 0.6 });
  if (!g) return false;
  const o = { niveau: 0.12 };
  boucle(fig, (dt, t) => { g.set('t', t); g.set('niveau', o.niveau); g.dessiner(); }, { lourde: true });
  ST().create({ trigger: sec || fig, start: 'top 85%', end: 'bottom 25%', scrub: 0.6, onUpdate: (s) => { o.niveau = 0.12 + s.progress * 0.42; } });
  return true;
}

/** Les trois couleurs empilées : chaque planche recule et s'assombrit quand la suivante arrive. */
export function planches(sec) {
  const cartes = sec ? $$('[data-planche]', sec) : [];
  if (!cartes.length || calme()) return;
  gsap().matchMedia().add('(max-width: 760px)', () => {
    cartes.forEach((c) => gsap().fromTo(c, { y: 50, opacity: 0.3 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top 95%', end: 'top 60%', scrub: 0.5 } }));
  });
  gsap().matchMedia().add('(min-width: 761px)', () => {
    cartes.slice(0, -1).forEach((c, i) => {
      gsap().fromTo(c, { scale: 1, filter: 'brightness(1)' }, { scale: 0.93, filter: 'brightness(0.9)', ease: 'none', scrollTrigger: { trigger: cartes[i + 1], start: 'top 85%', end: 'top 30%', scrub: true } });
    });
  });
}

/* ================= Application ================= */
/** Téléphone qui reste à l'écran : chaque fonction de la liste allume son écran. */
export function telephoneFonctions(sec) {
  if (!sec) return;
  const items = $$('[data-fonction]', sec), ecrans = $$('[data-ecran-f]', sec);
  let i = -1;
  const montrer = (k) => {
    if (k === i) return; i = k;
    items.forEach((el) => el.classList.toggle('est-active', +el.dataset.fonction === k));
    ecrans.forEach((el) => el.classList.toggle('est-active', +el.dataset.ecranF === k));
    const e = ecrans[k];
    if (e && !calme()) gsap().fromTo(e.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power3.out' });
    const tape = e && $('[data-tape]', e);
    if (tape && !calme()) { const mot = tape.dataset.tape, o = { n: 0 }; gsap().to(o, { n: mot.length, duration: 0.6, ease: 'none', onUpdate: () => { tape.textContent = mot.slice(0, Math.round(o.n)); } }); }
  };
  montrer(0);
  items.forEach((el) => el.addEventListener('click', () => montrer(+el.dataset.fonction)));
  if (calme()) return;
  const mm = gsap().matchMedia();
  mm.add('(min-width: 861px) and (min-height: 620px)', () => {
    sec.classList.add('est-epinglee');
    ST().create({ trigger: sec, start: 'top top', end: '+=110%', pin: true, scrub: true, invalidateOnRefresh: true, onUpdate: (s) => montrer(Math.min(items.length - 1, Math.floor(s.progress * items.length))) });
    return () => sec.classList.remove('est-epinglee');
  });
  mm.add('(max-width: 860px), (max-height: 619px)', () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) montrer(+e.target.dataset.fonction); }), { rootMargin: '-40% 0px -40% 0px' });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

/** Installation en direct : barre de téléchargement et écran du téléphone qui suivent les quatre étapes. */
export function installation(sec) {
  if (!sec) return;
  const txt = $('[data-install-texte]', sec), barre = $('[data-install-barre]', sec), etapes = $$('.etapes-install > li', sec);
  const ETATS = ['Téléchargement…', 'Autoriser l’installation ?', 'Installation…', 'MétéoFR est prêt'];
  const poser = (p) => {
    const e = p < 0.4 ? 0 : p < 0.58 ? 1 : p < 0.85 ? 2 : 3;
    const pc = e === 0 ? Math.round(p / 0.4 * 100) : e === 2 ? Math.round((p - 0.58) / 0.27 * 100) : 100;
    txt.textContent = e === 0 || e === 2 ? `${ETATS[e]} ${pc} %` : ETATS[e];
    barre.style.transform = `scaleX(${(pc / 100).toFixed(3)})`;
    sec.dataset.installEtat = e;
    etapes.forEach((li, i) => li.classList.toggle('est-active', i <= e));
  };
  if (calme()) { poser(1); return; }
  poser(0);
  ST().create({ trigger: sec, start: 'top 65%', end: 'bottom 55%', scrub: 0.5, onUpdate: (s) => poser(s.progress) });
}

/** Émergence : les nuages devant le téléphone s'écartent quand il monte. */
export function emergence(sec) {
  if (!sec || calme()) return;
  const g = $('.emergence-nuage--g', sec), d = $('.emergence-nuage--d', sec), ecran = $('.telephone--emergence .telephone-ecran', sec);
  if (!g || !d) return;
  gsap().fromTo(g, { xPercent: 0 }, { xPercent: -38, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
  gsap().fromTo(d, { xPercent: 0 }, { xPercent: 38, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
  return { intro(tl, t) { tl.fromTo([g, d], { yPercent: 18, opacity: 0.4 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }, t - 0.5).fromTo(ecran, { filter: 'brightness(.35)' }, { filter: 'brightness(1)', duration: 0.9, ease: 'power2.out' }, t + 0.3); } };
}

/* ================= Contact ================= */
/** Le ballon du formulaire monte d'un cran à chaque champ rempli ; l'altitude s'affiche. */
export function ballonFormulaire(form) {
  const rail = form && $('[data-ballon-rail]', form.closest('section'));
  if (!rail) return;
  const champs = $$('input:not([type="radio"]), textarea', form), choix = $$('input[type="radio"]', form);
  const pion = $('[data-ballon-pion]', rail), alt = $('[data-ballon-alt]', rail), etapes = $$('[data-etape-form]', form);
  const fmt = new Intl.NumberFormat('fr-FR');
  const maj = () => {
    const faits = [choix.some((c) => c.checked), ...champs.map((c) => c.value.trim().length > 1)];
    const k = faits.filter(Boolean).length / faits.length;
    rail.style.setProperty('--k', k.toFixed(3));
    alt.textContent = `${fmt.format(Math.round(k * 1200))} m`;
    etapes.forEach((e) => { const ok = $$('input, textarea', e).filter((c) => c.type !== 'radio').every((c) => !c.required || c.value.trim()) && (!$('input[type="radio"]', e) || $$('input[type="radio"]', e).some((c) => c.checked)); e.classList.toggle('est-faite', ok); });
    if (pion && !calme()) gsap().to(pion, { bottom: `${(k * 100).toFixed(1)}%`, duration: 0.6, ease: 'back.out(1.6)' }); else if (pion) pion.style.bottom = `${(k * 100).toFixed(1)}%`;
  };
  form.addEventListener('input', maj); form.addEventListener('change', maj);
  maj();
}

/* ================= 404 : « 404 » écrit dans la buée ================= */
export function ecrireDansLaBuee(cv) {
  if (!cv) return null;
  return (ctx, w, h) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.font = `700 ${Math.round(Math.min(w * 0.3, h * 0.55))}px Outfit, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, w * 0.012);
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.fillStyle = 'rgba(0,0,0,.42)';
    const x = w * (w > 700 ? 0.74 : 0.5), y = h * (w > 700 ? 0.46 : 0.72);
    ctx.fillText('404', x, y); ctx.strokeText('404', x, y);
    ctx.restore();
  };
}

/* ================= Partout : altimètre (repères des sections, sur ordinateur) ================= */
export function altimetre() {
  const rail = $('[data-altimetre]'); if (!rail) return;
  const sections = $$('main section[id][data-rail]');
  if (sections.length < 4) { rail.remove(); return; }
  rail.innerHTML = `<ol>${sections.map((s) => `<li><a href="#${s.id}" data-libelle="${s.dataset.rail}" aria-label="${s.dataset.rail}"><span aria-hidden="true">${s.dataset.rail}</span></a></li>`).join('')}</ol><span class="altimetre-curseur" aria-hidden="true"></span>`;
  rail.hidden = false;
  const liens = $$('a', rail), curseur = $('.altimetre-curseur', rail);
  rail.classList.add('au-debut');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const i = sections.indexOf(e.target); liens.forEach((a, j) => a.toggleAttribute('aria-current', j === i)); rail.classList.toggle('au-debut', i === 0); } }), { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
  const suivre = () => { const h = document.documentElement.scrollHeight - innerHeight; curseur.style.top = `${(h > 0 ? scrollY / h * 100 : 0).toFixed(2)}%`; };
  suivre(); window.addEventListener('scroll', suivre, { passive: true });
}
