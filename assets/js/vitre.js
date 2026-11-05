// Pluie sur la vitre : l'image d'ouverture vue à travers une vitre mouillée (WebGL, OGL).
// Gouttelettes posées qui naissent et s'effacent, gouttes qui ruissellent en laissant une traînée claire, chacune
// réfracte l'image ; buée facultative (image floutée par les niveaux de mipmap) que le pointeur essuie et qui se
// reforme lentement ; la pluie se raréfie et la vitre s'éclaircit au défilement. Sans WebGL, en mode calme ou sous
// « réduire les animations » : image avec quelques gouttes figées en SVG ; sans JavaScript : image seule.
// Adapté du module « pluie-sur-vitre » de la bibliothèque (shader, essuyage, éclaircie, repli figé repris tels quels) :
// seul le raccord au socle de la maquette change (mode calme, boucles qui s'arrêtent hors écran, OGL chargé à la demande).
import { boucle as boucleSocle, etat as etatSocle } from './socle/index.js?v=1';
let chargementOgl = null;
const chargerOgl = () => (chargementOgl ??= new Promise((ok) => { if (window.OGL) return ok(); const s = document.createElement('script'); s.src = '/assets/vendor/ogl.min.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
const S = {
  OGL: null,
  get calme() { return etatSocle.calme; },
  get telephone() { return innerWidth < 700; },
  webgl() { if (/[?&]sanswebgl\b/.test(location.search)) return false; try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } },
  boucle(el, fn) { const b = boucleSocle(el, (dt, t) => fn(t * 1000, dt * 1000), { lourde: true }); return { arreter: () => b.arreter() }; },
};
async function pret(besoins = []) { if (besoins.includes('ogl')) { await chargerOgl(); S.OGL = window.OGL || null; } return S; }

const VERT = 'attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }';
const FRAG = `precision highp float;
uniform sampler2D tMap; uniform sampler2D tEssuie;
uniform float uTime; uniform float uPluie; uniform float uClair;
uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uFocus;
uniform vec3 uReflet; uniform vec3 uTeinte;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float h11(float p){ return fract(sin(p * 127.1) * 43758.5453); }
// Recadrage « cover » autour du point focal.
vec2 cover(vec2 uv){
  float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 e = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  vec2 f = vec2(uFocus.x, 1.0 - uFocus.y);
  return (uv - 0.5) * e + 0.5 + (f - 0.5) * (1.0 - e);
}
// Gouttelettes posées sur la vitre : naissent, perlent, s'effacent.
vec3 posees(vec2 st, float t, float dens){
  vec2 g = st * dens; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  float r1 = h21(id), r2 = h21(id + 17.3), r3 = h21(id + 41.7);
  vec2 c = (vec2(r1, r2) - 0.5) * 0.6;
  float rad = mix(0.08, 0.27, r3 * r3);
  vec2 d = f - c;
  float vie = fract(t * 0.05 + r1 * 7.0);
  float vis = smoothstep(0.0, 0.08, vie) * smoothstep(1.0, 0.7, vie);
  float present = step(r2, uPluie * 0.65 + 0.04);
  float m = smoothstep(rad, rad * 0.5, length(d)) * vis * present;
  return vec3(d / rad, m);
}
// Gouttes qui ruissellent en zigzag, traînée claire et chapelet de gouttelettes derrière elles.
vec4 ruisselle(vec2 st, float t, float cols, float graine){
  float cx = st.x * cols; float id = floor(cx);
  float r1 = h11(id * 1.37 + graine), r2 = h11(id * 2.91 + graine * 3.1), r3 = h11(id * 5.17 + graine * 7.3);
  float actif = step(r1, uPluie * 0.8);
  float vitesse = mix(0.05, 0.14, r2);
  float ph = fract(t * vitesse + r3);
  float y = 1.15 - (ph + 0.035 * sin(ph * 31.0 + r1 * 6.0)) * 1.4;
  float lx = fract(cx) - 0.5;
  float zig = 0.10 * sin(st.y * 9.0 + r1 * 20.0) + 0.05 * sin(st.y * 23.0 + r2 * 13.0);
  float xx = (lx - (r2 - 0.5) * 0.4 - zig) / cols;
  float dy = st.y - y;
  float rad = mix(0.009, 0.019, r3);
  vec2 dv = vec2(xx, dy * 0.72);
  float tete = smoothstep(rad, rad * 0.45, length(dv)) * actif;
  float tl = mix(0.12, 0.34, r1);
  float dessus = smoothstep(0.0, 0.012, dy) * smoothstep(tl, 0.0, dy);
  float tw = rad * 0.6 * (1.0 - clamp(dy / tl, 0.0, 1.0)) + 0.0005;
  float trainee = smoothstep(tw, tw * 0.25, abs(xx)) * dessus * actif;
  float k = fract(st.y * 48.0 + r1) - 0.5;
  float petites = smoothstep(rad * 0.42, rad * 0.12, length(vec2(xx, k / 48.0))) * dessus * actif * step(0.4, fract(st.y * 9.0 + r3));
  return vec4(dv / rad, clamp(tete + petites, 0.0, 1.0), trainee);
}
void main(){
  vec2 uv = vUv; float asp = uRes.x / uRes.y; vec2 st = vec2(uv.x * asp, uv.y); float t = uTime;
  vec3 s1 = posees(st, t, 34.0);
  vec3 s2 = posees(st * 1.7 + 3.1, t + 11.0, 34.0);
  vec4 a = ruisselle(st, t, 7.0 * asp, 1.0);
  vec4 b = ruisselle(st + vec2(0.37, 0.0), t * 1.1 + 4.0, 12.0 * asp, 7.0);
  float goutte = clamp(max(max(s1.z, s2.z * 0.8), max(a.z, b.z)), 0.0, 1.0);
  vec2 n = s1.xy * s1.z + s2.xy * s2.z * 0.7 + a.xy * a.z + b.xy * b.z;
  float trainee = max(a.w, b.w);
  float essuie = texture2D(tEssuie, uv).r;
  float net = clamp(max(max(goutte, trainee * 0.85), max(essuie, uClair)), 0.0, 1.0);
  vec2 base = cover(uv);
  vec3 vif = texture2D(tMap, base - n * 0.02 * goutte).rgb;
  vec3 buee = texture2D(tMap, base, mix(5.5, 0.0, uClair)).rgb;
  buee = mix(buee, vec3(dot(buee, vec3(0.299, 0.587, 0.114))), 0.3) * 0.8 + uTeinte * 0.08;
  vec3 col = mix(buee, vif, net);
  col += uReflet * 0.17 * smoothstep(0.45, 1.0, goutte) * clamp(n.y * 0.6 + 0.2, 0.0, 1.0);
  col -= 0.07 * smoothstep(0.2, 0.6, goutte) * clamp(-n.y, 0.0, 1.0);
  vec2 q = uv - 0.5; col *= 1.0 - dot(q, q) * 0.55;
  gl_FragColor = vec4(col, 1.0);
}`;

// Couleur CSS (variables, color-mix…) → [r, g, b] entre 0 et 1, résolue par le navigateur.
function rgb(root, valeur) {
  const i = document.createElement('i'); i.style.cssText = 'position:absolute;visibility:hidden;color:' + valeur;
  root.appendChild(i); const c = getComputedStyle(i).color; i.remove();
  const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255];
}
const css = ([r, g, b], a = 1) => `rgba(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0},${a})`;
// Hasard reproductible (même image et mêmes gouttes figées à chaque visite).
function hasard(graine) { let s = graine >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// Image de démonstration neutre, peinte d'après les variables : crépuscule, lumières floues, silhouettes de toits.
function imageNeutre(root, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); const r = hasard(11);
  const fond = rgb(root, 'var(--couleur-fond)'), sec = rgb(root, 'var(--couleur-secondaire)'), acc = rgb(root, 'var(--couleur-accent)'), txt = rgb(root, 'var(--couleur-texte)');
  const lg = x.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, css(sec.map((v, i) => v * .5 + fond[i] * .5))); lg.addColorStop(.62, css(sec.map((v, i) => v * .85 + acc[i] * .15))); lg.addColorStop(1, css(fond));
  x.fillStyle = lg; x.fillRect(0, 0, w, h);
  const lueur = (cx, cy, rr, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, css(col, a)); g.addColorStop(1, css(col, 0)); x.fillStyle = g; x.fillRect(0, 0, w, h); };
  lueur(w * .72, h * .6, h * .6, acc, .6); lueur(w * .2, h * .3, h * .55, sec, .7);
  // Silhouettes de toits et fenêtres éclairées.
  x.fillStyle = css(fond.map((v, i) => v * .85 + sec[i] * .15));
  let px = 0;
  while (px < w) { const lw = w * (.05 + r() * .09), lh = h * (.16 + r() * .2); x.fillRect(px, h - lh, lw + 1, lh);
    x.beginPath(); x.moveTo(px, h - lh); x.lineTo(px + lw / 2, h - lh - h * .05 * r()); x.lineTo(px + lw, h - lh); x.fill();
    x.save(); x.fillStyle = css(acc, .75);
    for (let k = 0; k < 4; k++) if (r() < .55) x.fillRect(px + lw * (.15 + r() * .6), h - lh * (.25 + r() * .6), Math.max(4, w / 260), Math.max(6, h / 120));
    x.restore(); px += lw; }
  // Lumières floues (bokeh).
  for (let k = 0; k < 64; k++) { const col = r() < .6 ? acc : r() < .5 ? txt : sec; lueur(r() * w, h * (.2 + r() * .6), h * (.015 + r() * .05), col, .4 + r() * .5); }
  return c;
}

// Gouttes figées en SVG (repli), d'après le même hasard.
function gouttesFigees(el, intensite) {
  if (!el || el.firstChild) return;
  const r = hasard(5); const ns = 'http://www.w3.org/2000/svg';
  let s = '<defs><radialGradient id="pluie-g" fx=".38" fy=".3" r=".6"><stop offset="0" stop-color="currentColor" stop-opacity=".7"/><stop offset=".45" stop-color="currentColor" stop-opacity=".1"/><stop offset=".82" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity=".5"/></radialGradient>'
    + '<linearGradient id="pluie-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity=".28"/></linearGradient></defs>';
  const n = Math.round(120 * intensite);
  for (let k = 0; k < n; k++) { const cx = r() * 1600, cy = r() * 1000, rr = 3 + r() * r() * 11;
    s += `<ellipse class="pluie__ombre" cx="${cx.toFixed(0)}" cy="${(cy + rr * .35).toFixed(0)}" rx="${rr.toFixed(1)}" ry="${(rr * 1.05).toFixed(1)}"/><ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rr.toFixed(1)}" ry="${(rr * 1.05).toFixed(1)}" fill="url(#pluie-g)"/>`; }
  for (let k = 0; k < Math.round(7 * intensite); k++) { const x0 = 80 + r() * 1440, y1 = 300 + r() * 650, l = 160 + r() * 260, rr = 7 + r() * 6;
    let d = `M${x0} ${y1 - l}`; for (let j = 1; j <= 6; j++) d += ` L${(x0 + Math.sin(j * 1.7 + k) * 9).toFixed(0)} ${(y1 - l + l * j / 6).toFixed(0)}`;
    s += `<path d="${d}" fill="none" stroke="url(#pluie-t)" stroke-width="${(rr * .5).toFixed(1)}" stroke-linecap="round"/><ellipse class="pluie__ombre" cx="${x0}" cy="${(y1 + rr * .4).toFixed(0)}" rx="${rr.toFixed(1)}" ry="${(rr * 1.25).toFixed(1)}"/><ellipse cx="${x0}" cy="${y1.toFixed(0)}" rx="${rr.toFixed(1)}" ry="${(rr * 1.25).toFixed(1)}" fill="url(#pluie-g)"/>`; }
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 1600 1000'); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); svg.setAttribute('focusable', 'false');
  svg.innerHTML = s; el.appendChild(svg);
}

/**
 * @param {HTMLElement} root  section.pluie (contient .pluie__fond, canvas.pluie__canvas et .pluie__fige)
 * @param {object} [options]
 * @param {string} [options.image]          URL de l'image ; sinon l'<img> de .pluie__fond ; sinon crépuscule neutre généré
 * @param {number[]} [options.focus=[.5,.5]] point focal [x, y] (0 à 1) du recadrage
 * @param {number} [options.intensite=1]    quantité de pluie (0,2 à 1) : gouttelettes posées et coulées actives
 * @param {boolean} [options.buee=true]     buée sur la vitre, essuyée par le pointeur, qui se reforme lentement
 * @param {boolean} [options.eclaircie=true] la pluie se raréfie et la buée disparaît au défilement de la section
 * @param {number} [options.dpr=1.25]       densité de pixels maximale sur ordinateur (1 sous 700 px)
 * @param {'gouttes'|'net'} [options.repli='gouttes'] sans WebGL / mode calme : gouttes figées en SVG ou image seule
 * @returns {Promise<{detruire: Function, mesure: Function}>}
 */
export async function init(root, options = {}) {
  const o = { image: null, focus: [.5, .5], intensite: 1, buee: true, eclaircie: true, dpr: 1.25, repli: 'gouttes', ...options };
  o.intensite = Math.min(1, Math.max(.1, +o.intensite || 1));
  const fondEl = root.querySelector('.pluie__fond');
  const canvas = root.querySelector('.pluie__canvas');
  const figeEl = root.querySelector('.pluie__fige');
  let img = fondEl?.querySelector('img');
  if (o.image && fondEl) {
    img?.remove();
    img = document.createElement('img'); img.alt = ''; img.decoding = 'async';
    if (new URL(o.image, location.href).origin !== location.origin) img.crossOrigin = 'anonymous';
    img.src = o.image; fondEl.appendChild(img);
  }
  if (img) img.style.objectPosition = `${o.focus[0] * 100}% ${o.focus[1] * 100}%`;
  root.classList.toggle('pluie--buee', !!o.buee);
  const rien = { detruire() {}, mesure: () => null };
  const figer = () => { if (o.repli === 'gouttes') { gouttesFigees(figeEl, o.intensite); root.classList.add('pluie--fige'); } return rien; };

  const s = await pret([]);
  if (!canvas || s.calme || !s.webgl()) return figer();
  await pret(['ogl']);
  if (!s.OGL) return figer();

  // Source : image déjà chargée (aucun second téléchargement) ou crépuscule neutre généré.
  let source = null;
  if (img) {
    try { await (img.complete && img.naturalWidth ? Promise.resolve() : new Promise((ok, ko) => { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ko, { once: true }); })); await img.decode?.().catch(() => {}); source = img; }
    catch { source = null; }
  }
  if (!source) source = s.telephone ? imageNeutre(root, 720, 1280) : imageNeutre(root, 1600, 900);
  const sw = source.naturalWidth || source.width, sh = source.naturalHeight || source.height;

  // La pluie démarre quand le navigateur est disponible, jamais avant l'affichage du titre.
  await new Promise(r => requestAnimationFrame(() => (window.requestIdleCallback || (f => setTimeout(f, 200)))(r, { timeout: 1200 })));
  const O = s.OGL;
  let renderer, gl, program;
  try {
    renderer = new O.Renderer({ canvas, alpha: false, antialias: false, depth: false, dpr: Math.min(devicePixelRatio || 1, s.telephone ? 1 : o.dpr) });
    gl = renderer.gl;
  } catch { return figer(); }
  if (!gl) return figer();
  // Texture en puissance de deux pour les mipmaps (la buée est un niveau de mipmap flou).
  const pot = document.createElement('canvas');
  pot.width = s.telephone ? 1024 : 2048; pot.height = s.telephone ? 1024 : 1024;
  let tex;
  try { pot.getContext('2d').drawImage(source, 0, 0, pot.width, pot.height); pot.getContext('2d').getImageData(0, 0, 1, 1); }
  catch { try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {} return figer(); } // image d'une autre origine sans CORS
  tex = new O.Texture(gl, { image: pot, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR });
  // Buée essuyée : petite carte 160×160 peinte au pointeur, qui s'estompe.
  const essuie = document.createElement('canvas'); essuie.width = essuie.height = 160;
  const ec = essuie.getContext('2d'); ec.fillStyle = '#000'; ec.fillRect(0, 0, 160, 160);
  const texE = new O.Texture(gl, { image: essuie, generateMipmaps: false, minFilter: gl.LINEAR });
  const clair0 = o.buee ? .14 : 1;
  const u = {
    tMap: { value: tex }, tEssuie: { value: texE }, uTime: { value: Math.random() * 20 }, uPluie: { value: 0 }, uClair: { value: clair0 },
    uRes: { value: [1, 1] }, uImg: { value: [sw, sh] }, uFocus: { value: o.focus },
    uReflet: { value: rgb(root, 'var(--couleur-texte)') }, uTeinte: { value: rgb(root, 'var(--couleur-secondaire)') },
  };
  try { program = new O.Program(gl, { vertex: VERT, fragment: FRAG, uniforms: u }); }
  catch { return figer(); }
  const mesh = new O.Mesh(gl, { geometry: new O.Triangle(gl), program });

  const mesurer = () => { const r = root.getBoundingClientRect(); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height)); u.uRes.value = [gl.canvas.width, gl.canvas.height]; };
  mesurer();
  try { renderer.render({ scene: mesh }); if (gl.getError() === gl.CONTEXT_LOST_WEBGL) throw 0; }
  catch { try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {} return figer(); }

  // Essuyer la buée (souris, doigt, stylet), segment interpolé entre deux positions.
  let px = -1, py = -1;
  const essuyer = e => {
    if (!o.buee) return;
    const r = root.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 160, y = (e.clientY - r.top) / r.height * 160;
    ec.globalCompositeOperation = 'lighter';
    const pas = px < 0 ? 1 : Math.min(14, Math.ceil(Math.hypot(x - px, y - py) / 3));
    for (let i = 0; i < pas; i++) {
      const k = pas === 1 ? 1 : i / (pas - 1);
      const cx = px < 0 ? x : px + (x - px) * k, cy = py < 0 ? y : py + (y - py) * k;
      const g = ec.createRadialGradient(cx, cy, 0, cx, cy, 11);
      g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ec.fillStyle = g; ec.save(); ec.translate(cx, cy); ec.scale(r.height / r.width, 1); ec.translate(-cx, -cy);
      ec.beginPath(); ec.arc(cx, cy, 11, 0, Math.PI * 2); ec.fill(); ec.restore();
    }
    px = x; py = y;
  };
  const quitter = () => { px = py = -1; };
  root.addEventListener('pointermove', essuyer, { passive: true });
  root.addEventListener('pointerdown', essuyer, { passive: true });
  root.addEventListener('pointerleave', quitter);
  root.addEventListener('pointerup', quitter);
  const ro = new ResizeObserver(() => { mesurer(); renderer.render({ scene: mesh }); });
  ro.observe(root);

  // Garde-fou : médiane des intervalles entre rendus sur 40 images ; au-delà du budget, densité ×0,7 (jusqu'à 0,6), puis arrêt.
  const pasMin = s.telephone ? 1000 / 30 : 0; // 30 images/s sur téléphone
  const budget = s.telephone ? 50 : 34;
  let intervalles = [], arret = false, mediane = 0, images = 0, dernierRendu = 0, ecoule = 0;
  const surveiller = dt => {
    if (ecoule < 1) return;
    intervalles.push(dt); if (intervalles.length < 40) return;
    mediane = intervalles.sort((a, b) => a - b)[20]; intervalles = [];
    if (mediane <= budget) return;
    if (renderer.dpr > .6) { renderer.dpr = Math.max(.6, renderer.dpr * .7); mesurer(); return; }
    arreter(); root.classList.remove('pluie--actif'); figer();
  };

  const b = s.boucle(root, t => {
    if (arret) return;
    if (pasMin && t - dernierRendu < pasMin - 2) return;
    const dt = dernierRendu ? Math.min(100, t - dernierRendu) : 16; dernierRendu = t;
    ecoule += dt / 1000; u.uTime.value += Math.min(.05, dt / 1000); images++;
    // Arrivée de la pluie en 1,5 s, puis éclaircie au défilement.
    let e = 0;
    if (o.eclaircie) { const r = root.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))); e = p * p * (3 - 2 * p); }
    const arrivee = Math.min(1, ecoule / 1.5);
    u.uPluie.value = o.intensite * arrivee * (1 - .92 * e);
    u.uClair.value = clair0 + (1 - clair0) * Math.min(1, e * 1.25);
    ec.globalCompositeOperation = 'source-over'; ec.fillStyle = `rgba(0,0,0,${(.012 * dt / 16.7).toFixed(4)})`; ec.fillRect(0, 0, 160, 160);
    texE.needsUpdate = true;
    surveiller(dt);
    renderer.render({ scene: mesh });
  });
  function arreter() { arret = true; b.arreter(); ro.disconnect(); root.removeEventListener('pointermove', essuyer); root.removeEventListener('pointerdown', essuyer); root.removeEventListener('pointerleave', quitter); root.removeEventListener('pointerup', quitter); }
  root.classList.add('pluie--actif');

  return {
    /** dernière médiane mesurée (ms entre deux rendus), densité de pixels en cours, images rendues, arrêt du garde-fou */
    mesure: () => ({ mediane, dpr: renderer.dpr, images, arret }),
    detruire() {
      arreter(); root.classList.remove('pluie--actif', 'pluie--fige');
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}
    },
  };
}
