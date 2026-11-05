/* Effets propres à MétéoFR (plan d'animation) : chacun porte data-effet="nom" dans la page.
   Tous respectent le mode calme (état final direct) et ne lisent la mise en page qu'au chargement et au redimensionnement. */
import { boucle, etat as socle, partir } from './socle/index.js?v=1';
import { chercherCommunes, direction, lienCommune, memoriserLieu, deg } from './meteo.js?v=1';
import { courbeSVG } from './rendu.js?v=1';
import { CielVivant } from './ciel.js?v=1';

const gsap = () => window.gsap;
const ST = () => window.ScrollTrigger;
const calme = () => socle.calme || !gsap();

/* ---------- Recherche de commune (liste de suggestions accessible au clavier) ---------- */
export function initRecherche(form, { surChoix } = {}) {
  if (!form || form.__ok) return; form.__ok = true;
  const champ = form.querySelector('input'), liste = form.querySelector('[role="listbox"]'), etatEl = form.querySelector('[data-recherche-etat]');
  let resultats = [], actif = -1, minuteur = 0, demande = 0;
  const choisir = surChoix || ((l) => { memoriserLieu(l); partir(new URL(lienCommune(l), location.href), 'Ma commune'); });
  const fermer = () => { liste.hidden = true; champ.setAttribute('aria-expanded', 'false'); champ.removeAttribute('aria-activedescendant'); actif = -1; };
  const dire = (t) => { if (etatEl) etatEl.textContent = t; };
  const afficher = () => {
    if (!resultats.length) { fermer(); return; }
    liste.innerHTML = resultats.map((r, i) => `<li role="option" id="${form.id}-o${i}" aria-selected="${i === actif}" data-i="${i}">${r.nom}${r.dep ? ` (${r.dep})` : ''}<span>${r.detail}</span></li>`).join('');
    liste.hidden = false; champ.setAttribute('aria-expanded', 'true');
    if (actif >= 0) champ.setAttribute('aria-activedescendant', `${form.id}-o${actif}`);
  };
  const chercher = async (q) => {
    const n = ++demande;
    try {
      const r = await chercherCommunes(q);
      if (n !== demande) return r;
      resultats = r; actif = -1; afficher();
      dire(r.length ? `${r.length} commune${r.length > 1 ? 's' : ''} trouvée${r.length > 1 ? 's' : ''}` : 'Aucune commune trouvée');
      return r;
    } catch { if (n === demande) { resultats = []; fermer(); dire('Recherche indisponible pour le moment.'); } return []; }
  };
  champ.addEventListener('input', () => {
    clearTimeout(minuteur);
    const q = champ.value.trim();
    if (q.length < 2) { resultats = []; fermer(); dire(''); return; }
    minuteur = setTimeout(() => chercher(q), 220);
  });
  champ.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && resultats.length) { e.preventDefault(); actif = (actif + 1) % resultats.length; afficher(); }
    else if (e.key === 'ArrowUp' && resultats.length) { e.preventDefault(); actif = (actif - 1 + resultats.length) % resultats.length; afficher(); }
    else if (e.key === 'Escape') { fermer(); }
  });
  liste.addEventListener('pointerdown', (e) => e.preventDefault());
  liste.addEventListener('click', (e) => { const li = e.target.closest('li'); if (!li) return; const l = resultats[+li.dataset.i]; fermer(); champ.value = l.nom; choisir(l); });
  champ.addEventListener('blur', () => setTimeout(fermer, 150));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = champ.value.trim();
    if (actif >= 0 && resultats[actif]) { const l = resultats[actif]; fermer(); choisir(l); return; }
    if (q.length < 2) { dire('Tapez au moins deux lettres.'); champ.focus(); return; }
    const r = resultats.length ? resultats : await chercher(q);
    if (r && r[0]) { fermer(); champ.value = r[0].nom; choisir(r[0]); }
  });
  const loc = form.querySelector('[data-localiser]');
  if (loc) loc.addEventListener('click', () => {
    if (!navigator.geolocation) { dire('La localisation n\'est pas disponible sur cet appareil.'); return; }
    dire('Localisation en cours…');
    navigator.geolocation.getCurrentPosition(
      (p) => { dire(''); choisir({ nom: 'Votre position', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3), dep: '' }); },
      () => dire('Localisation refusée ou impossible : cherchez votre commune par son nom.'),
      { timeout: 8000, maximumAge: 600000 },
    );
  });
}

/* ---------- Girouette : la flèche s'oriente sur la vraie direction du vent, puis frémit avec les rafales ---------- */
export function girouette(fig) {
  if (!fig) return { regler() {} };
  const fleche = fig.querySelector('[data-girouette-fleche]');
  let dir = +fig.dataset.dir || 0, rafales = 10, vu = false;
  const poser = (a) => fleche.setAttribute('transform', `rotate(${a} 100 100)`);
  poser(dir);
  const g = gsap();
  if (!calme()) {
    const o = { a: dir - 160 };
    poser(o.a);
    ST().create({ trigger: fig, start: 'top 82%', once: true, onEnter: () => { vu = true; g.to(o, { a: dir, duration: 1.8, ease: 'elastic.out(1, 0.45)', onUpdate: () => poser(o.a) }); } });
    boucle(fig, (dt, t) => { if (!vu || g.isTweening(o)) return; poser(dir + Math.sin(t * 1.7) * Math.min(8, rafales / 6) + Math.sin(t * 4.3) * 1.2); });
  }
  return { regler(d, raf) { dir = d; rafales = raf; fig.dataset.dir = d; fleche.style.setProperty('--dir', `${d}deg`); if (calme()) poser(d); } };
}

/* ---------- Jauges qui se remplissent à l'arrivée ---------- */
export function jauges(ul) {
  if (!ul || calme()) return;
  const barres = ul.querySelectorAll('[data-jauge]');
  gsap().set(barres, { scaleX: 0 });
  ST().create({ trigger: ul, start: 'top 85%', once: true, onEnter: () => barres.forEach((b, i) => gsap().to(b, { scaleX: +getComputedStyle(b).getPropertyValue('--v') || 0, duration: 1.2, delay: i * 0.08, ease: 'power3.out' })) });
}

/* ---------- Courbe des 24 heures : se trace à l'arrivée, se lit au pointeur ou au doigt ---------- */
export function courbe(bloc) {
  if (!bloc) return { regler() {} };
  let heures = null, geo = null, rect = null, vue = false;
  const bulle = bloc.querySelector('[data-courbe-bulle]');
  const tracer = (anime) => {
    const trait = bloc.querySelector('.courbe-trait');
    if (!trait || calme() || !anime) return;
    const L = trait.getTotalLength();
    gsap().fromTo(trait, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', onComplete: () => gsap().set(trait, { clearProps: 'strokeDasharray,strokeDashoffset' }) });
    gsap().fromTo(bloc.querySelectorAll('.courbe-pluie rect'), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.6, stagger: 0.02, ease: 'power2.out', delay: 0.3 });
    gsap().fromTo(bloc.querySelectorAll('.courbe-reperes > *'), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.015, delay: 0.5 });
  };
  if (!calme()) {
    gsap().set(bloc.querySelector('.courbe-trait'), { opacity: 0 });
    ST().create({ trigger: bloc, start: 'top 80%', once: true, onEnter: () => { vue = true; gsap().set(bloc.querySelector('.courbe-trait'), { opacity: 1 }); tracer(true); } });
  }
  const lire = (clientX) => {
    if (!heures || !geo) return;
    const svg = bloc.querySelector('svg');
    if (!rect) rect = svg.getBoundingClientRect();
    const vx = (clientX - rect.left) / rect.width * geo.W;
    const i = Math.max(0, Math.min(heures.length - 1, Math.round((vx - 24) / ((geo.W - 48) / (heures.length - 1)))));
    const h = heures[i];
    bloc.classList.add('lit');
    const ligne = svg.querySelector('.courbe-curseur');
    ligne.setAttribute('x1', geo.x(i)); ligne.setAttribute('x2', geo.x(i));
    bulle.textContent = `${+h.h} h · ${deg(h.t)} · pluie ${h.pp ?? 0} %`;
    const px = geo.x(i) / geo.W * rect.width, py = geo.y(h.t) / (geo.W * (rect.height / rect.width)) * rect.height;
    bulle.style.transform = `translate(${Math.max(70, Math.min(rect.width - 70, px)) - bulle.offsetWidth / 2}px, ${Math.max(0, py - 56)}px)`;
  };
  bloc.addEventListener('pointerenter', () => { rect = null; });
  bloc.addEventListener('pointermove', (e) => lire(e.clientX));
  bloc.addEventListener('pointerdown', (e) => { rect = null; lire(e.clientX); });
  bloc.addEventListener('pointerleave', () => bloc.classList.remove('lit'));
  window.addEventListener('scroll', () => { rect = null; }, { passive: true });
  return {
    regler(h) {
      heures = h.slice(0, 25);
      const r = courbeSVG(heures);
      geo = r;
      const ancien = bloc.querySelector('svg'); const tmp = document.createElement('div'); tmp.innerHTML = r.svg;
      ancien.replaceWith(tmp.firstElementChild);
      if (vue) tracer(false);
      else if (!calme()) gsap().set(bloc.querySelector('.courbe-trait'), { opacity: 0 });
    },
  };
}

/* ---------- Vague de vigilance : les départements se colorent du nord au sud ---------- */
export function vagueVigilance(svg) {
  if (!svg || calme()) return;
  const deps = [...svg.querySelectorAll('.dep[class*="dep--"]')];
  deps.forEach((d) => { d.classList.add('attente'); d.style.transitionDelay = `${(+d.dataset.cy / 330) * 1.1}s`; });
  ST().create({ trigger: svg, start: 'top 75%', once: true, onEnter: () => deps.forEach((d) => d.classList.remove('attente')) });
  gsap().fromTo(svg.querySelectorAll('.dep'), { opacity: 0.35 }, { opacity: 1, stagger: { each: 0.004, from: 'start' }, duration: 0.5, scrollTrigger: { trigger: svg, start: 'top 80%', once: true } });
}

/* ---------- Semainier : filtre jours secs / jours de pluie, réorganisé en Flip ; barres min-max qui montent ---------- */
export function semainier(ul, boutons) {
  if (!ul) return { regler() {} };
  const animerBarres = () => {
    if (calme()) return;
    const barres = ul.querySelectorAll('[data-thermo]');
    gsap().fromTo(barres, { scaleY: 0 }, { scaleY: 1, duration: 1, stagger: 0.04, ease: 'power3.out', scrollTrigger: { trigger: ul, start: 'top 82%', once: true } });
    gsap().fromTo(ul.children, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.035, ease: 'power3.out', scrollTrigger: { trigger: ul, start: 'top 85%', once: true } });
  };
  let filtre = 'tous';
  const appliquer = (anime) => {
    const items = [...ul.children];
    const F = window.Flip;
    const etatFlip = anime && F && !calme() ? F.getState(items) : null;
    const garde = items.filter((li) => filtre === 'tous' || li.dataset.pluie === filtre);
    const reste = items.filter((li) => !garde.includes(li));
    const ordre = filtre === 'tous' ? items.sort((a, b) => a.dataset.flipId.slice(1) - b.dataset.flipId.slice(1)) : [...garde, ...reste];
    ordre.forEach((li) => ul.appendChild(li));
    items.forEach((li) => li.classList.toggle('estompe', !garde.includes(li)));
    if (etatFlip) F.from(etatFlip, { duration: 0.6, ease: 'power3.inOut', absolute: false });
    ul.scrollTo({ left: 0, behavior: calme() ? 'auto' : 'smooth' });
    ST() && ST().refresh();
  };
  boutons && boutons.forEach((b) => b.addEventListener('click', () => {
    filtre = b.dataset.filtre;
    boutons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    appliquer(true);
  }));
  animerBarres();
  return { regler(html, tmin, tmax) { ul.innerHTML = html; ul.style.setProperty('--tmin', tmin); ul.style.setProperty('--tmax', tmax); appliquer(false); } };
}

/* ---------- Mini-ciels des grandes villes : chaque carte peint le ciel réel de sa ville ---------- */
const PALETTES = {
  clair: ['#2f73d6', '#7fb2ee', '#d6e8fb'], nuageux: ['#5b7499', '#93a7c4', '#cdd7e6'], pluie: ['#3c4b63', '#66778f', '#8f9db0'],
  orage: ['#2a2f4d', '#4e4a6c', '#a08470'], neige: ['#8d98ad', '#c2cad8', '#eef1f6'], brouillard: ['#a8b1bd', '#cfd5dc', '#e9ecef'],
  nuit: ['#050d22', '#13284f', '#2a4373'], crepuscule: ['#24345e', '#c0627a', '#f6a43a'],
};
export function miniCiels(cartes, etatDe) {
  cartes.forEach((a) => {
    const cv = a.querySelector('[data-mini-ciel]');
    const ciel = new CielVivant(cv, { leger: true });
    const peindre = () => {
      const e = etatDe(a);
      const [h, m, b] = PALETTES[e] || PALETTES.nuageux;
      a.style.background = `linear-gradient(180deg, ${h} 0%, ${m} 55%, ${b} 100%)`;
      ciel.regler({ etat: e, vent: 15, dir: 270, pluie: e === 'pluie' ? 1 : 0 });
    };
    a.__peindre = peindre; peindre();
  });
}

/* ---------- Téléphone : l'écran suit l'étape lue ---------- */
export function telephone(bloc) {
  if (!bloc) return;
  const ecrans = bloc.querySelectorAll('[data-ecran]');
  const montrer = (i) => ecrans.forEach((e) => e.classList.toggle('est-active', +e.dataset.ecran === i));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) montrer(+e.target.dataset.etape); }), { rootMargin: '-45% 0px -45% 0px' });
  bloc.querySelectorAll('[data-etape]').forEach((el) => io.observe(el));
  if (!calme()) gsap().matchMedia().add('(min-width: 861px)', () => { gsap().fromTo(bloc.querySelector('.telephone'), { y: 60, rotate: -4 }, { y: -30, rotate: 3, ease: 'none', scrollTrigger: { trigger: bloc, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }); });
  if (!calme()) gsap().matchMedia().add('(max-width: 860px)', () => { gsap().fromTo(bloc.querySelector('.telephone'), { rotate: -3 }, { rotate: 3, ease: 'none', scrollTrigger: { trigger: bloc, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }); });
}

/* ---------- Isobares : les lignes de pression s'incurvent au fil de la page ---------- */
export function isobares(el) {
  if (!el || calme()) return;
  const paths = [...el.querySelectorAll('path')];
  const dessiner = (p) => paths.forEach((pa, i) => {
    const y = 120 + i * 130, a = Math.sin(p * 6 + i * 0.9) * 55, b = Math.cos(p * 5 + i * 1.3) * 60;
    pa.setAttribute('d', `M-50 ${y + b * 0.3} C 250 ${y - 40 + a}, 650 ${y + 60 - b}, 1050 ${y + a * 0.4}`);
  });
  dessiner(0);
  ST().create({ trigger: document.querySelector('main'), start: 'top top', end: 'bottom bottom', onUpdate: (s) => dessiner(s.progress) });
}

/* ---------- 404 : brouillard qui se dissipe sous le doigt ou la souris, puis se reforme ---------- */
export function brouillard(cv) {
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let w = 0, h = 0;
  const masque = document.createElement('canvas'); const mc = masque.getContext('2d');
  const taille = () => { const r = cv.getBoundingClientRect(); w = cv.width = Math.round(r.width * 0.5); h = cv.height = Math.round(r.height * 0.5); masque.width = w; masque.height = h; mc.clearRect(0, 0, w, h); };
  taille(); new ResizeObserver(taille).observe(cv);
  const essuyer = (e) => { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) * 0.5, y = (e.clientY - r.top) * 0.5; const g = mc.createRadialGradient(x, y, 0, x, y, 70); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); mc.globalCompositeOperation = 'source-over'; mc.fillStyle = g; mc.fillRect(x - 70, y - 70, 140, 140); };
  cv.parentElement.addEventListener('pointermove', essuyer, { passive: true });
  cv.parentElement.addEventListener('pointerdown', essuyer, { passive: true });
  const peindre = (t) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      const x = ((t * (6 + i * 3) + i * 230) % (w + 400)) - 200, y = h * (0.2 + i * 0.16);
      const g = ctx.createRadialGradient(x, y, 0, x, y, w * 0.5);
      g.addColorStop(0, 'rgba(244,246,248,.78)'); g.addColorStop(1, 'rgba(244,246,248,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(240,243,246,.45)'; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(masque, 0, 0); ctx.globalCompositeOperation = 'source-over';
    mc.globalCompositeOperation = 'destination-out'; mc.fillStyle = 'rgba(0,0,0,.02)'; mc.fillRect(0, 0, w, h); mc.globalCompositeOperation = 'source-over';
  };
  boucle(cv, (dt, t) => peindre(t));
  if (socle.calme) peindre(0);
}

export { direction };
