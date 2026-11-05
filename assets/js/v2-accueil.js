/* Effets v2 de l'accueil : la météo réelle pilote le mouvement (vent, nuages, heure du soleil, altitude).
   Chaque effet porte data-effet="nom" dans la page, respecte le mode calme (état final direct, aucune boucle)
   et garde une version sans WebGL. */
import { boucle, etat as socle } from './socle/index.js?v=2';
import * as M from './meteo.js?v=2';
import { glPlein } from './gl.js?v=2';
import { remplacerIcone } from './rendu.js?v=2';

const gsap = () => window.gsap;
const ST = () => window.ScrollTrigger;
const calme = () => socle.calme || !gsap();
const RAD = Math.PI / 180;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
/* Pendant le défilement, les effets continus les plus lourds gardent leur dernière image : le défilement reste fluide. */
let dernierDefil = 0;
window.addEventListener('scroll', () => { dernierDefil = performance.now(); }, { passive: true });
const enDefilement = () => performance.now() - dernierDefil < 140;

/* Couleurs du ciel selon la hauteur du soleil (haut, milieu, bas) : même échelle que l'intro. */
const CLES = [
  [-12, ['#040a1c', '#0a1a3a', '#13284f']], [-4, ['#141b45', '#4b3c74', '#c86a5a']], [3, ['#284a8e', '#c77f8a', '#f6b26b']],
  [12, ['#2f6fd1', '#6fa4e6', '#cfe3fb']], [40, ['#1f5fbf', '#4f8fe0', '#b8d7fa']],
];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function degradeCiel(alt) {
  let a = CLES[0], b = CLES[CLES.length - 1];
  for (let i = 1; i < CLES.length; i++) if (alt <= CLES[i][0]) { a = CLES[i - 1]; b = CLES[i]; break; }
  const k = Math.max(0, Math.min(1, (alt - a[0]) / (b[0] - a[0] || 1)));
  const c = a[1].map((x, i) => { const p = hex(x), q = hex(b[1][i]); return `rgb(${p.map((v, j) => Math.round(v + (q[j] - v) * k)).join(' ')})`; });
  return `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 62%, ${c[2]} 100%)`;
}

/* ================= Ciel réel : nuages WebGL poussés par le vrai vent ================= */
const FRAG_NUAGES = `precision mediump float;
uniform vec2 r; uniform float t; uniform float couv; uniform vec2 vent; uniform vec3 cl; uniform vec3 co;
uniform float opa; uniform vec3 astre; uniform vec3 ac; uniform vec2 souris;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * n(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return v; }
float fbm2(vec2 p){ return 0.5 * n(p) + 0.25 * n(p * 2.03 + vec2(17.1, 9.2)) + 0.125; }
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  float y = max(uv.y, 0.03);
  vec2 p = vec2((uv.x - 0.5) * asp / (0.45 + y * 0.9), 1.0 / (0.22 + y)) * 1.35 + souris * vec2(0.35, 0.18);
  vec2 dep = vent * t;
  float w = fbm(p * 0.7 + dep * 0.55);
  vec2 q = p + dep + vec2(w, w * 0.5) * 1.25;
  float d = fbm(q);
  float seuil = mix(0.74, 0.3, couv);
  float c = smoothstep(seuil, seuil + 0.24, d);
  vec2 vers = normalize(astre.xy - uv + 0.0001) * 0.09;
  float lum = clamp(0.55 + (fbm2(q) - fbm2(q + vers)) * 6.0, 0.0, 1.0);
  vec3 col = mix(co, cl, lum);
  float a = c * opa * smoothstep(0.02, 0.4, uv.y);
  float dist = length((uv - astre.xy) * vec2(asp, 1.0));
  float halo = astre.z * (exp(-dist * 5.5) * 0.5 + exp(-dist * 24.0) * 0.65) * (1.0 - c * 0.85);
  gl_FragColor = vec4(col * a + ac * halo, clamp(a + halo * 0.6, 0.0, 1.0));
}`;
/* état du ciel → [couleur claire, couleur d'ombre, opacité, force de l'astre] */
const TEINTES = {
  clair: [[1, 1, 1], [0.78, 0.84, 0.93], 0.5, 0.85], nuageux: [[0.97, 0.98, 1], [0.6, 0.66, 0.76], 0.6, 0.22],
  pluie: [[0.74, 0.78, 0.84], [0.33, 0.37, 0.46], 0.72, 0.2], orage: [[0.58, 0.58, 0.66], [0.15, 0.16, 0.23], 0.78, 0.08],
  neige: [[0.97, 0.98, 1], [0.74, 0.78, 0.86], 0.62, 0.3], brouillard: [[0.93, 0.94, 0.95], [0.82, 0.84, 0.87], 0.36, 0.25],
  nuit: [[0.38, 0.44, 0.6], [0.07, 0.1, 0.19], 0.6, 0.5], crepuscule: [[1, 0.8, 0.66], [0.45, 0.3, 0.42], 0.6, 1],
};
export function nuagesReels(canvas, section) {
  if (!canvas) return null;
  const g = glPlein(canvas, FRAG_NUAGES, { echelle: innerWidth < 760 ? 0.28 : 0.34 });
  if (!g) { canvas.hidden = true; return null; }
  const p = { couv: 0.6, vx: 0.01, vy: 0, cl: [1, 1, 1], co: [0.6, 0.66, 0.76], opa: 0.6, ax: 0.7, ay: 0.7, az: 0, ac: [1, 0.93, 0.8] };
  const cible = { ...p };
  const s = { x: 0, y: 0, tx: 0, ty: 0 };
  const t0 = Math.random() * 60;
  let tps = t0;
  const peindre = () => {
    g.set('t', tps); g.set('couv', p.couv); g.set('vent', p.vx, p.vy); g.set('cl', ...p.cl); g.set('co', ...p.co);
    g.set('opa', p.opa); g.set('astre', p.ax, p.ay, p.az); g.set('ac', ...p.ac); g.set('souris', s.x, s.y);
    g.dessiner();
  };
  if (section && matchMedia('(hover: hover)').matches) section.addEventListener('pointermove', (e) => { s.tx = e.clientX / innerWidth - 0.5; s.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  const mix = (a, b, k) => a + (b - a) * k;
  boucle(canvas, (dt) => {
    tps += dt;
    if (enDefilement()) return;
    const k = 1 - Math.exp(-dt * 1.2);
    ['couv', 'vx', 'vy', 'opa', 'ax', 'ay', 'az'].forEach((n) => { p[n] = mix(p[n], cible[n], k); });
    ['cl', 'co', 'ac'].forEach((n) => { p[n] = p[n].map((v, i) => mix(v, cible[n][i], k)); });
    s.x = mix(s.x, s.tx, 1 - Math.exp(-dt * 2.5)); s.y = mix(s.y, s.ty, 1 - Math.exp(-dt * 2.5));
    if (section) section.style.setProperty('--px', `${(-s.x * 18).toFixed(1)}px`), section.style.setProperty('--py', `${(-s.y * 10).toFixed(1)}px`);
    peindre();
  }, { lourde: true });
  new ResizeObserver(() => { if (calme()) peindre(); }).observe(canvas);
  return {
    regler({ etat, nuages, vent, dir, lieu, quand }) {
      const T = TEINTES[etat] || TEINTES.nuageux;
      [cible.cl, cible.co, cible.opa] = [T[0], T[1], T[2]];
      cible.couv = Math.max(0.14, Math.min(1, (nuages ?? 50) / 100));
      const to = ((dir ?? 270) + 180) * RAD, v = 0.006 + Math.min(70, vent ?? 10) / 1500;
      cible.vx = Math.sin(to) * v; cible.vy = Math.cos(to) * v * 0.6;
      const sol = M.positionSoleil(quand, lieu.lat, lieu.lon);
      let astre = null, couleur = etat === 'crepuscule' ? [1, 0.62, 0.34] : [1, 0.93, 0.8], force = T[3];
      if (sol.alt > -4) astre = sol;
      else { const l = M.positionLune(quand, lieu.lat, lieu.lon); if (l.alt > 0) { astre = l; couleur = [0.82, 0.88, 1]; force = etat === 'nuit' ? 0.5 : 0.25; } }
      if (astre) { cible.ax = 0.5 + Math.max(-1, Math.min(1, astre.az / 110)) * 0.45; cible.ay = 0.4 + Math.max(0, Math.min(1, astre.alt / 50)) * 0.52; cible.az = force; } else cible.az = 0;
      cible.ac = couleur;
      if (calme()) { Object.assign(p, cible); peindre(); }
    },
  };
}

/* ================= Champ de vent : des filets d'air traversent la section dans la vraie direction ================= */
export function champDeVent(cv) {
  if (!cv) return { regler() {} };
  const ctx = cv.getContext('2d');
  const p = { vent: 10, dir: 270, rafales: 20 };
  let w = 0, h = 0, s = 1, parts = [];
  const nouvelle = (partout) => ({ x: Math.random() * w, y: Math.random() * h, vie: 1.6 + Math.random() * 2.8, age: partout ? Math.random() * 2 : 0 });
  const mesurer = () => {
    const r = cv.getBoundingClientRect(); s = Math.min(window.devicePixelRatio || 1, 1.5);
    w = cv.width = Math.max(1, Math.round(r.width * s)); h = cv.height = Math.max(1, Math.round(r.height * s));
    const n = Math.round(Math.max(60, Math.min(innerWidth < 760 ? 110 : 230, (r.width * r.height) / 5200)));
    parts = Array.from({ length: n }, () => nouvelle(true));
  };
  mesurer(); new ResizeObserver(mesurer).observe(cv);
  boucle(cv, (dt, t) => {
    if (enDefilement()) return;
    const to = (p.dir + 180) * RAD, ux = Math.sin(to), uy = -Math.cos(to);
    const rapport = Math.max(1, p.rafales / Math.max(1, p.vent));
    const rafale = 1 + (rapport - 1) * Math.pow(Math.max(0, Math.sin(t * 0.55)), 6);
    const v = (34 + Math.min(80, p.vent) * 5.5) * rafale * s;
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.15 * s; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(47,111,209,.32)';
    ctx.beginPath();
    for (const q of parts) {
      const a = Math.sin(q.x * 0.0032 / s + t * 0.4) * 0.32 + Math.cos(q.y * 0.004 / s - t * 0.3) * 0.32;
      const c = Math.cos(a), sn = Math.sin(a);
      ctx.moveTo(q.x, q.y);
      q.x += (ux * c - uy * sn) * v * dt; q.y += (ux * sn + uy * c) * v * dt;
      ctx.lineTo(q.x, q.y);
      q.age += dt;
      if (q.age > q.vie || q.x < -12 || q.x > w + 12 || q.y < -12 || q.y > h + 12) Object.assign(q, nouvelle(false));
    }
    ctx.stroke();
  }, { lourde: true });
  return { regler(m) { p.vent = m.vent ?? p.vent; p.dir = m.dir ?? p.dir; p.rafales = m.rafales ?? p.rafales; } };
}

/* Chiffres des jauges qui défilent à l'arrivée (la valeur en direct reste la référence). */
export function compterJauges(ul) {
  if (!ul || calme()) return;
  const els = $$('.jauge-val strong[data-m]', ul);
  ST().create({ trigger: ul, start: 'top 85%', once: true, onEnter: () => els.forEach((el, i) => {
    const final = el.textContent;
    const lire = () => parseFloat(String(el.dataset.cible ?? final).replace(',', '.')) || 0;
    const dec = /,/.test(el.dataset.cible ?? final) ? 1 : 0;
    const depart = el.dataset.m === 'pression' ? 980 : 0, o = { k: 0 };
    gsap().to(o, { k: 1, duration: 1.3, delay: i * 0.07, ease: 'power3.out',
      onUpdate: () => { el.textContent = (depart + (lire() - depart) * o.k).toFixed(dec).replace('.', ','); },
      onComplete: () => { el.textContent = el.dataset.cible ?? final; } });
  }) });
}

/* ================= Journée en accéléré : le défilement fait avancer l'heure ================= */
export function journee(sec, { crb, modele }) {
  if (!sec) return { regler() {} };
  const ciel = $('[data-heures-ciel]', sec), aff = $('[data-heures-affiche]', sec), etoiles = $('[data-heures-etoiles]', sec);
  const champ = (k) => $(`[data-ha="${k}"]`, aff);
  let i = -1;
  const montrer = (k, { force = false, depuisCourbe = false } = {}) => {
    const m = modele(); const hs = m && m.heures; if (!hs || !hs.length) return;
    k = Math.max(0, Math.min(hs.length - 1, k)); if (k === i && !force) return; i = k;
    const h = hs[k];
    const base = m.direct ? new Date() : new Date(`${m.maj}:00+01:00`);
    base.setMinutes(0, 0, 0);
    const alt = M.hauteurSoleil(new Date(base.getTime() + k * 3600e3), m.lieu.lat, m.lieu.lon);
    if (ciel) ciel.style.background = degradeCiel(alt);
    sec.toggleAttribute('data-sombre', alt < -2);
    if (etoiles) etoiles.style.opacity = alt < -8 ? 1 : alt < -2 ? ((-alt - 2) / 6).toFixed(2) : 0;
    champ('heure').textContent = k === 0 ? 'Maintenant' : `${+h.h} h`;
    champ('t').textContent = M.deg(h.t);
    champ('lib').textContent = M.libelle(h.code);
    champ('pp').textContent = `pluie ${h.pp ?? 0} %`;
    remplacerIcone($('svg', aff), M.icone(h.code, h.jour));
    if (!depuisCourbe && crb && crb.montrer) crb.montrer(k);
    const lis = $$('[data-heures] li', sec);
    lis.forEach((li, j) => li.classList.toggle('est-active', j === k));
    const li = lis[k], d = li && li.closest('.defile');
    if (d) {
      if (!d.__pos || d.__pos.length !== lis.length) { d.__pos = lis.map((x) => x.offsetLeft + x.offsetWidth / 2); d.__l = d.clientWidth; }
      d.scrollLeft = d.__pos[k] - d.__l / 2;
    }
  };
  sec.addEventListener('courbe:heure', (e) => montrer(e.detail, { depuisCourbe: true }));
  montrer(0, { force: true });
  if (!calme()) {
    const mm = gsap().matchMedia();
    mm.add('(min-width: 861px) and (min-height: 640px)', () => {
      sec.classList.add('est-epinglee');
      ST().create({ trigger: sec, start: 'top top', end: '+=85%', pin: true, scrub: true, invalidateOnRefresh: true, onUpdate: (s) => montrer(Math.round(s.progress * 24)) });
      return () => sec.classList.remove('est-epinglee');
    });
    mm.add('(max-width: 860px), (max-height: 639px)', () => {
      ST().create({ trigger: sec, start: 'top 60%', end: 'bottom 40%', scrub: true, onUpdate: (s) => montrer(Math.round(s.progress * 24)) });
    });
  }
  return { regler: () => { const d = $('[data-heures]', sec); if (d && d.closest('.defile')) d.closest('.defile').__pos = null; montrer(Math.max(0, i), { force: true }); } };
}

/* ================= Vigilance qui se répand comme une encre ================= */
let nEncre = 0;
export function encre(svg, { declencheur } = {}) {
  if (!svg) return;
  const colores = $$('.dep[class*="dep--"]', svg);
  if (!colores.length) return;
  const niv = (p) => (p.classList.contains('dep--rouge') ? 3 : p.classList.contains('dep--orange') ? 2 : 1);
  const finir = () => colores.forEach((p) => { p.classList.remove('attente'); p.classList.toggle('souleve', niv(p) >= 2); });
  if (calme()) { finir(); return; }
  const id = `encre-${++nEncre}`;
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  svg.prepend(defs);
  const disp = defs.querySelector('feDisplacementMap');
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'encre'); g.setAttribute('filter', `url(#${id})`);
  const maxi = colores.reduce((a, p) => (niv(p) > niv(a) ? p : a), colores[0]);
  const cb = maxi.getBBox(), cx = cb.x + cb.width / 2, cy = cb.y + cb.height / 2;
  const taches = colores.map((p) => {
    const c = document.createElementNS(NS, 'path');
    c.setAttribute('d', p.getAttribute('d')); c.setAttribute('class', `encre-tache encre-tache--${['', 'jaune', 'orange', 'rouge'][niv(p)]}`);
    const b = p.getBBox(); g.appendChild(c);
    return { c, d: Math.hypot(b.x + b.width / 2 - cx, b.y + b.height / 2 - cy) };
  });
  svg.appendChild(g);
  colores.forEach((p) => p.classList.add('attente'));
  const dm = Math.max(1, ...taches.map((x) => x.d));
  gsap().set(taches.map((x) => x.c), { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
  ST().create({ trigger: declencheur || svg, start: 'top 72%', once: true, onEnter: () => {
    const tl = gsap().timeline({ onComplete: () => { finir(); g.remove(); defs.remove(); } });
    taches.forEach(({ c, d }) => tl.to(c, { scale: 1, opacity: 1, duration: 0.95, ease: 'power2.out' }, (d / dm) * 1.4));
    tl.fromTo(disp, { attr: { scale: 22 } }, { attr: { scale: 0 }, duration: 2.5, ease: 'power2.in' }, 0);
  } });
}

/* ================= Écran radar : anneaux de distance, point de la commune, faisceau ================= */
export function radarEcran(scene, { lieu, faisceau = false } = {}) {
  if (!scene) return { placer() {} };
  const svg = $('svg.france', scene);
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'radar-anneaux');
  svg.appendChild(g);
  const et = document.createElement('div'); et.className = 'radar-etiquettes'; et.setAttribute('aria-hidden', 'true'); scene.appendChild(et);
  const placer = (l) => {
    if (!l) return;
    const [x, y] = M.surCarte(svg, l.lat, l.lon), vb = svg.viewBox.baseVal;
    const km = 40075 * Math.cos(l.lat * RAD) / (256 * 2 ** (+svg.dataset.zoom || 5));
    const f = (v) => v.toFixed(1), px = (v) => `${(v / vb.width * 100).toFixed(2)}%`, py = (v) => `${(v / vb.height * 100).toFixed(2)}%`;
    g.innerHTML = [100, 200, 300].map((d) => `<circle class="radar-anneau" cx="${f(x)}" cy="${f(y)}" r="${f(d / km)}"/>`).join('')
      + `<circle class="radar-ici-onde" cx="${f(x)}" cy="${f(y)}" r="3.4"/><circle class="radar-ici" cx="${f(x)}" cy="${f(y)}" r="2.6"/>`;
    et.innerHTML = [200, 300].map((d) => { const rr = d / km; return `<span class="radar-km" style="left:${px(x + rr * 0.72)};top:${py(y - rr * 0.72)}">${d}\u00a0km</span>`; }).join('')
      + `<span class="radar-ici-nom" style="left:${px(x + 6)};top:${py(y + 5)}">${l.nom.replace(/[<&>]/g, '')}</span>`;
  };
  placer(lieu);
  if (faisceau) {
    const b = document.createElement('div'); b.className = 'faisceau faisceau--continu'; b.setAttribute('aria-hidden', 'true'); scene.appendChild(b);
    if (calme()) b.hidden = true; else boucle(scene, (dt, t) => { b.style.transform = `rotate(${((t * 42) % 360).toFixed(1)}deg)`; });
  }
  return { placer };
}

/* ================= Bandes de chaleur : le ruban des seize jours ================= */
export function bandes(ol, semainierUl) {
  if (!ol) return;
  ol.addEventListener('click', (e) => {
    const b = e.target.closest('[data-jour-i]'); if (!b || !semainierUl) return;
    const li = semainierUl.querySelector(`[data-flip-id="j${b.dataset.jourI}"]`); if (!li) return;
    const d = li.closest('.defile');
    if (d) d.scrollTo({ left: li.offsetLeft - d.clientWidth / 2 + li.offsetWidth / 2, behavior: calme() ? 'auto' : 'smooth' });
    li.classList.remove('eclaire'); void li.offsetWidth; li.classList.add('eclaire');
  });
  if (calme()) return;
  gsap().fromTo(ol, { clipPath: 'inset(0% 100% 0% 0% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', ease: 'none', scrollTrigger: { trigger: ol, start: 'top 90%', end: 'top 50%', scrub: 0.6 } });
}

/* ================= Téléphone de l'appli : section épinglée, l'écran suit l'étape ================= */
export function appli(sec) {
  if (!sec) return;
  const etapes = $$('[data-etape]', sec), ecrans = $$('[data-ecran]', sec);
  $$('.appli-fond picture', sec).forEach((p) => p.setAttribute('data-audit-ignorer', ''));
  let i = -1;
  const animer = (k) => {
    const e = ecrans[k]; if (!e || calme()) return;
    const G = gsap();
    if (k === 0) {
      const ch = $('[data-tape]', e); const mot = ch.dataset.tape, o = { n: 0 };
      G.fromTo(o, { n: 0 }, { n: mot.length, duration: 0.7, ease: 'none', onUpdate: () => { ch.textContent = mot.slice(0, Math.round(o.n)); } });
      G.fromTo($$('.ea-sugg li', e), { y: 10, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, delay: 0.7, duration: 0.35 });
    } else if (k === 1) {
      G.fromTo($('.ea-temp', e), { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.8)' });
      G.fromTo($$('.ea-heures li', e), { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, delay: 0.2, duration: 0.4 });
    } else if (k === 2) {
      G.fromTo($$('.ea-pluie', e), { x: -46, opacity: 0 }, { x: 18, opacity: 1, duration: 2.2, ease: 'sine.inOut', stagger: 0.25 });
    } else if (k === 3) {
      G.fromTo($('.ea-alerte', e), { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
      G.fromTo($('.ea-alerte svg', e), { rotation: -22 }, { rotation: 0, duration: 1, ease: 'elastic.out(1.2, .22)', transformOrigin: '50% 10%' });
    }
  };
  const montrer = (k) => {
    if (k === i) return; i = k;
    etapes.forEach((el) => el.classList.toggle('est-active', +el.dataset.etape === k));
    ecrans.forEach((el) => el.classList.toggle('est-active', +el.dataset.ecran === k));
    animer(k);
  };
  montrer(0);
  if (calme()) { etapes.forEach((el) => el.classList.add('est-active')); return; }
  const mm = gsap().matchMedia();
  mm.add('(min-width: 861px) and (min-height: 600px)', () => {
    sec.classList.add('est-epinglee');
    ST().create({ trigger: sec, start: 'top top', end: '+=95%', pin: true, scrub: true, invalidateOnRefresh: true, onUpdate: (s) => montrer(Math.min(3, Math.floor(s.progress * 4))) });
    gsap().fromTo($('.telephone', sec), { rotate: -5, y: 30 }, { rotate: 3, y: -16, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: '+=95%', scrub: 0.6 } });
    return () => sec.classList.remove('est-epinglee');
  });
  mm.add('(max-width: 860px), (max-height: 599px)', () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) montrer(+e.target.dataset.etape); }), { rootMargin: '-42% 0px -42% 0px' });
    etapes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

/* ================= Radiosondage : le ballon monte, l'altimètre compte, l'air se raréfie ================= */
const BALLON = { large: { bx: 0.697, by: 0.222, r: 0.033, boite: 0.555, ratio: 1600 / 1074 }, portrait: { bx: 0.693, by: 0.253, r: 0.042, boite: 0.443, ratio: 480 / 715 } };
export function radiosondage(sec, { t0 = 12 } = {}) {
  if (!sec) return { regler() {} };
  const scene = $('[data-effet="radiosondage"]', sec);
  const img = $('.sonde-sol img', scene), sol = $('.sonde-sol', scene);
  const grp = $('[data-sonde-ballon]', scene), env = $('[data-sonde-enveloppe]', scene), para = $('[data-sonde-parachute]', scene), eclat = $('[data-sonde-eclat]', scene);
  const ciel = $('[data-sonde-ciel]', scene), etoiles = $('[data-sonde-etoiles]', scene);
  const champ = (k) => $(`[data-sonde="${k}"]`, scene);
  const fmt = new Intl.NumberFormat('fr-FR');
  let T0 = t0, k = 0, geo = null;
  const atmos = (hm) => {
    const km = hm / 1000;
    const T = km <= 11 ? T0 - 6.5 * km : km <= 20 ? T0 - 71.5 : T0 - 71.5 + (km - 20);
    const P = hm <= 11000 ? 1013.25 * Math.pow(1 - 2.25577e-5 * hm, 5.25588) : 226.32 * Math.exp(-(hm - 11000) / 6341.6);
    return [T, P];
  };
  /* Où est le ballon de la photo, une fois la photo recadrée dans la colonne ? */
  const mesurer = () => {
    const r = scene.getBoundingClientRect(); if (!r.width) return;
    const B = img && /-mobile-/.test(img.currentSrc || '') ? BALLON.portrait : BALLON.large;
    const pos = (getComputedStyle(img || scene).objectPosition || '70% 40%').split(' ').map((v) => parseFloat(v) / 100);
    const dw = Math.max(r.width, r.height * B.ratio), dh = dw / B.ratio;
    const ox = (r.width - dw) * (pos[0] || 0.7), oy = (r.height - dh) * (pos[1] || 0.4);
    geo = { w: r.width, h: r.height, x: ox + B.bx * dw, y: oy + B.by * dh, r: B.r * dw, boite: (B.boite - B.by) * dh };
    grp.style.setProperty('--br', `${geo.r.toFixed(1)}px`);
    grp.style.setProperty('--fil', `${Math.max(10, geo.boite - geo.r).toFixed(1)}px`);
  };
  const poser = () => {
    if (!geo) return;
    const hm = Math.round((k * 30000) / 50) * 50, [T, P] = atmos(hm);
    champ('alt').textContent = `${fmt.format(hm)} m`;
    champ('t').textContent = `${Math.round(T) < 0 ? '−' : ''}${Math.abs(Math.round(T))} °C`;
    champ('p').textContent = `${fmt.format(Math.max(1, Math.round(P)))} hPa`;
    const zoom = 1 + Math.min(1, k / 0.22) * 0.9;                      // travelling avant vers le ballon de la photo
    const suivi = Math.max(0, Math.min(1, (k - 0.22) / 0.2));           // puis la caméra le suit, centré
    const cx = geo.x + (geo.w * 0.5 - geo.x) * suivi, cy = geo.y + (geo.h * 0.4 - geo.y) * suivi;
    if (sol) { sol.style.transformOrigin = `${geo.x}px ${geo.y}px`; sol.style.transform = `translate(${(cx - geo.x).toFixed(1)}px, ${(cy - geo.y + Math.max(0, k - 0.2) * geo.h * 1.2).toFixed(1)}px) scale(${zoom.toFixed(3)})`; sol.style.opacity = Math.max(0, 1 - Math.max(0, k - 0.16) / 0.16).toFixed(3); }
    grp.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) scale(${zoom.toFixed(3)})`;
    grp.style.opacity = k < 0.05 ? 0 : Math.min(1, (k - 0.05) / 0.08).toFixed(3);
    const eclate = k > 0.93;
    env.style.transform = `scale(${(1 + Math.min(1, k) * 0.9).toFixed(3)})`;
    env.style.opacity = eclate ? 0 : 1;
    eclat.style.opacity = eclate ? Math.max(0, 1 - (k - 0.93) * 18).toFixed(3) : 0;
    para.style.opacity = eclate ? 1 : 0;
    ciel.style.opacity = Math.min(1, Math.max(0, (k - 0.1) / 0.5)).toFixed(3);
    etoiles.style.opacity = Math.max(0, (k - 0.5) * 2).toFixed(3);
  };
  const relancer = () => { mesurer(); poser(); };
  new ResizeObserver(relancer).observe(scene);
  if (img) img.addEventListener('load', relancer);
  if (calme()) { k = 0.62; relancer(); return { regler(t) { T0 = t; poser(); } }; }
  relancer();
  ST().create({ trigger: sec, start: 'top 70%', end: 'bottom 30%', scrub: 0.5, onUpdate: (s) => { k = s.progress; poser(); } });
  return { regler(t) { if (typeof t === 'number') T0 = t; poser(); } };
}

/* ================= Grandes villes : les cartes glissent au fil du défilement (sans épinglage) ================= */
export function villesGlissantes(sec) {
  if (!sec || calme()) return;
  const piste = $('[data-galerie]', sec), barre = $('.galerie-progres span', sec);
  gsap().matchMedia().add('(min-width: 761px)', () => {
    const dist = () => Math.max(0, piste.scrollWidth - sec.clientWidth);
    gsap().fromTo(piste, { x: 0 }, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, start: 'top 75%', end: 'bottom 25%', scrub: 0.6, invalidateOnRefresh: true } });
    if (barre) gsap().fromTo(barre, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 75%', end: 'bottom 25%', scrub: 0.6 } });
    gsap().fromTo($$('.ville', sec), { rotateY: -14, z: -40 }, { rotateY: 8, z: 0, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
  });
}
