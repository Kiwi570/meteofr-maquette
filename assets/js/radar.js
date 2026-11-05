/* Radar de pluie : vraies images RainViewer des deux dernières heures, posées sur la carte des départements
   (même projection Web Mercator, niveau de zoom 5). Accueil : le défilement fait avancer les images.
   Page Radar : lecture, pause et curseur, plus le « balayage » d'ouverture. Hors ligne : message, carte seule. */
const API = 'https://api.rainviewer.com/public/weather-maps.json';

function chargerImage(src) {
  return new Promise((ok) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
}

export class Radar {
  constructor(scene, { etiquette, progres, message } = {}) {
    this.scene = scene;
    this.canvas = scene.querySelector('[data-radar-canvas]');
    this.ctx = this.canvas.getContext('2d');
    const svg = scene.querySelector('svg.france');
    const [ox, oy] = svg.dataset.origine.split(',').map(Number);
    const vb = svg.viewBox.baseVal;
    this.o = { ox, oy, w: vb.width, h: vb.height, z: +svg.dataset.zoom };
    this.etiquette = etiquette; this.progres = progres; this.message = message;
    this.images = []; this.index = -1; this.pret = null; this.revele = 1;
    this.mesurer();
    new ResizeObserver(() => { this.mesurer(); this.dessiner(this.index, true); }).observe(this.canvas);
  }
  mesurer() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  charger() {
    if (this.pret) return this.pret;
    this.pret = (async () => {
      try {
        const c = new AbortController(); setTimeout(() => c.abort(), 7000);
        const d = await fetch(API, { signal: c.signal }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
        const passe = (d.radar && d.radar.past) || [];
        const { ox, oy, w, h, z } = this.o;
        const tx0 = Math.floor(ox / 256), tx1 = Math.floor((ox + w) / 256), ty0 = Math.floor(oy / 256), ty1 = Math.floor((oy + h) / 256);
        const cadres = await Promise.all(passe.map(async (f) => {
          const tuiles = [];
          for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) tuiles.push({ x, y, src: `${d.host}${f.path}/256/${z}/${x}/${y}/2/1_1.png` });
          const imgs = await Promise.all(tuiles.map((t) => chargerImage(t.src).then((i) => ({ ...t, i }))));
          return { t: f.time, tuiles: imgs.filter((x) => x.i) };
        }));
        this.images = cadres.filter((c) => c.tuiles.length);
        if (!this.images.length) throw new Error('vide');
        if (this.message) this.message.hidden = true;
        return true;
      } catch {
        this.images = [];
        if (this.message) { this.message.textContent = 'Images radar indisponibles pour le moment\u00a0: la carte reste affichée.'; this.message.hidden = false; }
        if (this.etiquette) this.etiquette.textContent = 'Radar indisponible';
        return false;
      }
    })();
    return this.pret;
  }
  heure(i) {
    const f = this.images[i]; if (!f) return '';
    const s = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(new Date(f.t * 1000)).replace(':', ' h ');
    return `Image de ${s}`;
  }
  /** i : index d'image (peut être fractionnaire : fondu entre deux images). */
  dessiner(i, force = false) {
    const n = this.images.length;
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    if (!n) { ctx.clearRect(0, 0, W, H); return; }
    const k = Math.max(0, Math.min(n - 1, i));
    const a = Math.floor(k), b = Math.min(n - 1, a + 1), m = k - a;
    if (!force && Math.abs(k - this.index) < 0.01) return;
    this.index = k;
    const s = W / this.o.w;
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    const poser = (f, alpha) => {
      ctx.globalAlpha = alpha;
      for (const t of f.tuiles) ctx.drawImage(t.i, (t.x * 256 - this.o.ox) * s, (t.y * 256 - this.o.oy) * s, 256 * s, 256 * s);
    };
    poser(this.images[a], 1 - m * 0.999);
    if (m > 0.001) poser(this.images[b], m);
    ctx.globalAlpha = 1;
    /* Balayage : seule la part déjà « vue » par le faisceau est montrée. */
    if (this.revele < 1) {
      ctx.globalCompositeOperation = 'destination-in';
      const cx = W / 2, cy = H / 2, r = Math.hypot(W, H);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + this.revele * Math.PI * 2); ctx.closePath();
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.etiquette) this.etiquette.textContent = this.heure(Math.round(k));
    if (this.progres) this.progres.style.transform = `scaleX(${n > 1 ? k / (n - 1) : 1})`;
  }
}
