/* Effet WebGL « onde » sur une image [data-fx="onde"] (figure .media du gabarit) :
   l'image ondule et ses couleurs se décalent légèrement selon la vitesse de défilement (au doigt comme à la molette),
   et une loupe douce suit la souris (souris seulement). Réglage : data-fx-force (1 par défaut, de 0.3 à 2).

   Au repos, c'est l'image d'origine, nette, qui est affichée : le canvas n'apparaît que pendant le mouvement,
   puis s'efface. Quand la souris s'arrête, la loupe se retire en moins d'une seconde : rien ne dérive.
   Règles tenues : densité de pixels limitée (1,25 sur ordinateur, 1 sur téléphone), rendu seulement à l'écran,
   onglet visible et hors mode calme (boucle du socle), aucun rendu quand rien ne bouge, 3 lectures de texture par pixel,
   image d'origine gardée dessous (repli sans WebGL ou si le contexte est perdu), 6 images au plus par page. */
import { boucle } from './boucles.js?v=2';

const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FS = `precision mediump float;
varying vec2 v;
uniform sampler2D tex;
uniform vec2 res, img, pos, souris;
uniform float vit, loupe, temps, contenir;
/* object-fit cover (par défaut) ou contain (œuvres jamais recadrées), avec object-position. */
vec2 couvrir(vec2 uv){
  float rc = res.x / res.y, ri = img.x / img.y;
  if (contenir > .5) {
    vec2 f = rc > ri ? vec2(ri / rc, 1.) : vec2(1., rc / ri);
    return (uv - (1. - f) * pos) / f;
  }
  vec2 s = rc > ri ? vec2(1., ri / rc) : vec2(rc / ri, 1.);
  return clamp(uv * s + (1. - s) * pos, 0.001, 0.999);
}
vec4 lire(vec2 uv){
  vec2 c = couvrir(uv);
  if (c.x < 0. || c.y < 0. || c.x > 1. || c.y > 1.) return vec4(0.);
  return texture2D(tex, c);
}
void main(){
  vec2 uv = vec2(v.x, 1. - v.y);
  float a = vit;
  uv.x += sin(uv.y * 8. + temps * 1.6) * .022 * a;
  uv.y += sin(uv.x * 6. - temps * 1.2) * .012 * a;
  vec2 d = uv - souris;
  float r = length(d * vec2(res.x / res.y, 1.));
  uv -= d * loupe * .16 * smoothstep(.34, 0., r);
  float dec = .007 * abs(a) + .0025 * loupe * smoothstep(.34, 0., r);
  vec4 c = lire(uv);
  float rr = lire(uv + vec2(dec, 0.)).r;
  float bb = lire(uv - vec2(dec, 0.)).b;
  /* La texture est déjà prémultipliée (UNPACK_PREMULTIPLY_ALPHA) : pas de seconde multiplication. */
  gl_FragColor = vec4(rr, c.g, bb, c.a);
}`;

function programme(gl) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

/* object-position en fractions (0 à 1) ; une valeur en pixels compte pour le centre. object-fit : contain ou cover. */
function cadrage(img) {
  const st = getComputedStyle(img);
  const parts = st.objectPosition.split(/\s+/);
  const f = (x) => (x && x.endsWith('%') ? parseFloat(x) / 100 : 0.5);
  return { pos: [f(parts[0]), f(parts[1])], contenir: st.objectFit === 'contain' || st.objectFit === 'scale-down' ? 1 : 0 };
}

function monter(el) {
  const img = el.querySelector('img');
  if (!img) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-onde';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
  if (!gl) return; /* sans WebGL : l'image reste seule */
  let prog;
  try { prog = programme(gl); } catch (err) { console.error('[onde]', err); return; }
  const tactile = window.matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, tactile ? 1 : 1.25);
  const force = Math.min(2, Math.max(0.3, parseFloat(el.dataset.fxForce) || 1));

  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const lieu = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(lieu);
  gl.vertexAttribPointer(lieu, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const U = { res: u('res'), img: u('img'), pos: u('pos'), souris: u('souris'), vit: u('vit'), loupe: u('loupe'), temps: u('temps'), contenir: u('contenir') };
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const s = { pret: false, w: 0, h: 0, iw: 1, ih: 1, pos: [0.5, 0.5], contenir: 0, vit: 0, loupe: 0, cible: 0, mx: 0.5, my: 0.5, bouge: 0, y: window.scrollY, t: 0 };

  /* Un seul envoi de texture par image (et un nouveau si le navigateur choisit une autre taille de srcset),
     réduite à la taille du canvas (createImageBitmap, hors du fil principal quand c'est possible). */
  let source = '';
  const charger = async () => {
    if (!img.complete || !img.naturalWidth || img.currentSrc === source) return;
    source = img.currentSrc;
    let bitmap = img;
    try {
      const largeur = Math.min(img.naturalWidth, Math.max(64, Math.ceil((s.w || img.naturalWidth) * dpr * 1.25)));
      if (window.createImageBitmap && largeur < img.naturalWidth) {
        bitmap = await createImageBitmap(img, { resizeWidth: largeur, resizeHeight: Math.round(largeur * img.naturalHeight / img.naturalWidth), resizeQuality: 'high' });
      }
    } catch { bitmap = img; }
    try {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
      s.iw = img.naturalWidth; s.ih = img.naturalHeight; s.pret = true;
    } catch (err) { console.error('[onde] texture', err); }
    if (bitmap !== img && bitmap.close) bitmap.close();
  };
  img.addEventListener('load', () => { charger(); });

  /* Canvas calé sur la boîte de l'image (pas sur la figure : légende, cadre) ; mesuré par ResizeObserver,
     jamais pendant le défilement. */
  new ResizeObserver(() => {
    s.w = img.offsetWidth; s.h = img.offsetHeight;
    canvas.style.left = img.offsetLeft + 'px'; canvas.style.top = img.offsetTop + 'px';
    canvas.style.width = s.w + 'px'; canvas.style.height = s.h + 'px';
    canvas.width = Math.max(1, Math.round(s.w * dpr)); canvas.height = Math.max(1, Math.round(s.h * dpr));
    const c = cadrage(img); s.pos = c.pos; s.contenir = c.contenir;
  }).observe(img);

  canvas.addEventListener('webglcontextlost', () => { canvas.remove(); arret.arreter(); });
  const picture = el.querySelector(':scope > picture') || img;
  picture.after(canvas);

  if (!tactile) {
    el.dataset.souris = '';
    let raf = 0, dernier = null;
    el.addEventListener('pointermove', (e) => {
      dernier = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = img.getBoundingClientRect();
        s.mx = (dernier.clientX - r.left) / r.width; s.my = (dernier.clientY - r.top) / r.height;
        s.cible = 1; s.bouge = performance.now();
      });
    });
    el.addEventListener('pointerleave', () => { s.cible = 0; });
  }

  let actif = false, affiche = false, eteint = 0;
  const arret = boucle(el, (_dt, t) => {
    if (!s.pret) return;
    /* Temps propre à cette image : la boucle du socle saute une image sur deux pendant le défilement (boucle lourde),
       et ne tourne pas hors écran ; après une pause, la vitesse repart de zéro (pas de pic). */
    const dt = s.t ? t - s.t : 0;
    s.t = t;
    const y = window.scrollY;
    const v = dt > 0 && dt < 0.12 ? (y - s.y) / dt : 0;
    s.y = y;
    if (!dt || dt >= 0.12) return;
    s.vit += (Math.max(-1, Math.min(1, v / 2600)) * force - s.vit) * Math.min(1, dt * 5);
    /* La loupe se retire dès que la souris s'arrête : l'image revient à l'original, sans dérive. */
    if (s.cible && performance.now() - s.bouge > 450) s.cible = 0;
    s.loupe += (s.cible * force - s.loupe) * Math.min(1, dt * 6);
    const enMouvement = Math.abs(s.vit) > 0.004 || s.loupe > 0.004;
    if (enMouvement !== actif) {
      actif = enMouvement;
      if (actif) { canvas.classList.add('fx-onde--actif'); affiche = true; }
      else { canvas.classList.remove('fx-onde--actif'); eteint = t; }
    }
    /* Rendu seulement pendant le mouvement, et le temps du fondu de sortie. */
    if (!actif && affiche && t - eteint > 0.4) affiche = false;
    if (!actif && !affiche) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, s.w || 1, s.h || 1);
    gl.uniform2f(U.img, s.iw, s.ih);
    gl.uniform2f(U.pos, s.pos[0], s.pos[1]);
    gl.uniform1f(U.contenir, s.contenir);
    gl.uniform2f(U.souris, s.mx, s.my);
    gl.uniform1f(U.vit, s.vit);
    gl.uniform1f(U.loupe, s.loupe);
    /* Temps ramené à une période commune des deux ondulations (5π) : précision intacte en mediump, même après des heures. */
    gl.uniform1f(U.temps, t % (5 * Math.PI));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, { lourde: true });
  /* Prête quand la texture est envoyée (ou en échec) : l'ouverture l'attend, avec son délai maximal. */
  return (img.decode ? img.decode() : Promise.resolve()).then(charger, () => {});
}

export function initOnde() {
  const liste = [...document.querySelectorAll('[data-fx="onde"]')];
  if (liste.length > 6) console.warn('[onde] plus de 6 images : seules les 6 premières ondulent');
  /* Seules les images déjà chargées (ou prioritaires) sont attendues par l'ouverture ; les autres, paresseuses,
     envoient leur texture quand elles arrivent. */
  return Promise.all(liste.slice(0, 6).map((el) => {
    try {
      const p = monter(el);
      const img = el.querySelector('img');
      return img && (img.loading !== 'lazy' || img.complete) ? p : null;
    } catch (err) { console.error('[onde]', err); return null; }
  }));
}
