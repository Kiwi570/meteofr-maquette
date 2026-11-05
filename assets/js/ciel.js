/* « Ciel vivant » : la photo du ciel suit le temps réel de la commune (8 états) et un calque canvas
   y ajoute ce qui bouge vraiment : pluie inclinée par le vent, flocons, nuages qui dérivent à la vitesse
   du vent, étoiles, bancs de brume, éclairs espacés (jamais plus d'un double éclair toutes les 7 s). */
import { boucle, etat as socle } from './socle/index.js?v=1';

const LARGEURS = [640, 1168, 1600], MOBILES = [480, 784, 1080];
const MENTION = 'Illustration générée';

export function figureCiel(etatCiel, { priorite = false, active = false } = {}) {
  const n = `/assets/images/grok/ciel-${etatCiel}`;
  const f = document.createElement('figure');
  f.className = 'media ciel-photo' + (active ? ' est-active' : '');
  f.dataset.grok = '';
  f.style.setProperty('--cadrage', '50% 70%');
  f.style.setProperty('--cadrage-mobile', '50% 60%');
  f.innerHTML = `<picture data-audit-ignorer><source media="(max-width: 760px) and (orientation: portrait)" srcset="${MOBILES.map((w) => `${n}-mobile-${w}.webp ${w}w`).join(', ')}" sizes="100vw"><img src="${n}-1168.webp" srcset="${LARGEURS.map((w) => `${n}-${w}.webp ${w}w`).join(', ')}" sizes="100vw" alt="" width="1168" height="784" decoding="async"${priorite ? ' fetchpriority="high"' : ''}></picture><figcaption class="mention-ia">${MENTION}</figcaption>`;
  return f;
}

export class CielVivant {
  constructor(canvas, { leger = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.leger = leger;
    this.p = { etat: 'nuageux', vent: 10, dir: 270, pluie: 0, nuages: 50 };
    this.parts = [];
    this.flash = 0; this.prochainEclair = 4 + Math.random() * 4;
    this.mesurer();
    new ResizeObserver(() => { this.mesurer(); this.semer(); if (socle.calme) this.dessiner(0, 0); }).observe(canvas);
    this.semer();
    this.b = boucle(canvas, (dt, t) => this.dessiner(dt, t), { lourde: true });
  }
  mesurer() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.25) * (this.leger ? 0.75 : 1);
    this.w = Math.max(1, Math.round(r.width * dpr)); this.h = Math.max(1, Math.round(r.height * dpr));
    this.canvas.width = this.w; this.canvas.height = this.h; this.dpr = dpr;
  }
  regler(p) { Object.assign(this.p, p); this.semer(); if (socle.calme) this.dessiner(0, 0); }
  semer() {
    const { etat, pluie } = this.p, w = this.w, h = this.h, s = this.dpr, R = Math.random;
    const petit = innerWidth < 760 || this.leger;
    const parts = [];
    if (etat === 'pluie' || etat === 'orage') {
      const n = Math.round((petit ? 70 : 150) * Math.min(1, 0.45 + pluie / 3));
      for (let i = 0; i < n; i++) parts.push({ k: 'goutte', x: R() * w, y: R() * h, l: (14 + R() * 22) * s, v: (900 + R() * 700) * s, a: 0.18 + R() * 0.3 });
    }
    if (etat === 'neige') for (let i = 0; i < (petit ? 60 : 130); i++) parts.push({ k: 'flocon', x: R() * w, y: R() * h, r: (1 + R() * 2.6) * s, v: (30 + R() * 50) * s, ph: R() * 6.28 });
    if (etat === 'nuit') for (let i = 0; i < (petit ? 50 : 110); i++) parts.push({ k: 'etoile', x: R() * w, y: R() * h * 0.62, r: (0.5 + R() * 1.3) * s, ph: R() * 6.28, f: 0.6 + R() * 1.8 });
    if (etat === 'nuageux' || etat === 'clair' || etat === 'crepuscule' || etat === 'pluie' || etat === 'orage') {
      const n = etat === 'clair' ? 3 : 6;
      for (let i = 0; i < n; i++) parts.push({ k: 'voile', x: R() * w, y: h * (0.05 + R() * 0.45), rx: w * (0.18 + R() * 0.22), ry: h * (0.05 + R() * 0.07), a: etat === 'clair' ? 0.07 : 0.1 + R() * 0.08, v: 0.4 + R() * 0.8 });
    }
    if (etat === 'brouillard') for (let i = 0; i < 6; i++) parts.push({ k: 'brume', x: R() * w, y: h * (0.35 + R() * 0.6), rx: w * (0.35 + R() * 0.3), ry: h * (0.08 + R() * 0.1), a: 0.16 + R() * 0.12, v: 0.25 + R() * 0.4 });
    this.parts = parts;
  }
  dessiner(dt, t) {
    const { ctx, w, h } = this, { etat, vent, dir } = this.p;
    ctx.clearRect(0, 0, w, h);
    /* Vent vers l'est si la direction vient de l'ouest : composante horizontale du déplacement. */
    const vx = Math.sin(((dir + 180) % 360) * Math.PI / 180) * Math.min(60, vent) / 60;
    const derive = (vent / 3.6) * 6 * this.dpr; // px/s
    for (const p of this.parts) {
      if (p.k === 'goutte') {
        p.y += p.v * dt; p.x += vx * p.v * 0.35 * dt;
        if (p.y > h) { p.y = -p.l; p.x = Math.random() * w; }
        if (p.x > w) p.x -= w; if (p.x < 0) p.x += w;
        ctx.strokeStyle = `rgba(225,236,255,${p.a})`; ctx.lineWidth = 1.2 * this.dpr;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - vx * p.l * 0.35, p.y - p.l); ctx.stroke();
      } else if (p.k === 'flocon') {
        p.y += p.v * dt; p.ph += dt; p.x += (Math.sin(p.ph) * 12 + vx * 30) * dt * this.dpr;
        if (p.y > h) { p.y = -4; p.x = Math.random() * w; }
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      } else if (p.k === 'etoile') {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.f + p.ph));
        ctx.fillStyle = `rgba(255,255,240,${a * 0.9})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      } else {
        p.x += derive * p.v * Math.sign(vx || 1) * dt;
        if (p.x - p.rx > w) p.x = -p.rx; if (p.x + p.rx < 0) p.x = w + p.rx;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rx);
        const c = etat === 'crepuscule' ? '255,190,150' : '255,255,255';
        g.addColorStop(0, `rgba(${c},${p.a})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, p.ry / p.rx); ctx.translate(-p.x, -p.y);
        ctx.fillStyle = g; ctx.fillRect(p.x - p.rx, p.y - p.rx, p.rx * 2, p.rx * 2); ctx.restore();
      }
    }
    /* Éclairs : un éclair (parfois double) toutes les 7 à 14 s, jamais plus de 2 flashs par seconde. */
    if (etat === 'orage' && dt > 0) {
      this.prochainEclair -= dt;
      if (this.prochainEclair <= 0) { this.flash = 1; this.double = Math.random() < 0.4 ? 0.45 : 0; this.prochainEclair = 7 + Math.random() * 7; }
      if (this.double > 0) { this.double -= dt; if (this.double <= 0) this.flash = 0.7; }
      if (this.flash > 0) { ctx.fillStyle = `rgba(235,240,255,${0.28 * this.flash})`; ctx.fillRect(0, 0, w, h); this.flash = Math.max(0, this.flash - dt * 7); }
    }
  }
}

/* Chiffres en rouleaux : chaque chiffre est une colonne 0-9 qui défile jusqu'à sa valeur,
   puis le nombre redevient un texte simple (lecteurs d'écran, mesures, sélection). */
export function rouleaux(el, texte, { animer = true, duree = 0.9, delai = 0 } = {}) {
  const gsap = window.gsap;
  if (!el) return;
  clearTimeout(el.__fin);
  if (!animer || !gsap || socle.calme || !/\d/.test(texte)) { el.textContent = texte; return; }
  const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
  const mesure = document.createElement('span');
  mesure.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  el.textContent = ''; el.appendChild(mesure);
  const largeur = (ch) => { mesure.textContent = ch; return (mesure.getBoundingClientRect().width / fs).toFixed(3); };
  const parts = [...texte].map((ch) => (/\d/.test(ch)
    ? `<span class="rouleau" aria-hidden="true" style="width:${largeur(ch)}em"><span data-chiffre="${ch}">${'0123456789'.split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`
    : `<span aria-hidden="true">${ch}</span>`));
  el.innerHTML = `<span class="visuellement-cache">${texte}</span>${parts.join('')}`;
  const cols = el.querySelectorAll('[data-chiffre]');
  let fin = 0;
  cols.forEach((c, i) => {
    const d = duree + i * 0.12;
    fin = Math.max(fin, d);
    gsap.fromTo(c, { yPercent: -((+c.dataset.chiffre + 5 + i * 3) % 10) * 10 }, { yPercent: -(+c.dataset.chiffre) * 10, duration: d, delay: delai, ease: 'power3.out' });
  });
  el.__fin = setTimeout(() => { el.textContent = texte; }, (delai + fin) * 1000 + 60);
}
