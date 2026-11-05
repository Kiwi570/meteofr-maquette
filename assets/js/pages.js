/* Pages intérieures : chacune a son ouverture (intro, arrivée sous le voile) et ses effets propres. */
import { etat, boucle } from './socle/index.js?v=2';
import * as M from './meteo.js?v=2';
import * as E from './effets-meteo.js?v=2';
import { Radar } from './radar.js?v=2';
import { rouleaux, figureCiel } from './ciel.js?v=2';
import { init as initPluie } from './vitre.js?v=2';
import { listeHeuresHTML, majTexte, remplacerIcone } from './rendu.js?v=2';
import * as V from './v2-pages.js?v=2';
import * as A from './v2-accueil.js?v=2';

const gsap = window.gsap;
const calme = () => etat.calme || !gsap;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ST = () => window.ScrollTrigger;
const texte = (cle, v) => $$(`[data-m="${cle}"]`).forEach((el) => { if (!el.hasAttribute('data-rouleaux')) el.textContent = v; });
const montee = (tl, sel, t, opts = {}) => { const els = $$(sel); if (els.length) tl.fromTo(els, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', ...opts }, t); return tl; };
const nomDep = (code) => { const p = $(`svg.france [data-dep="${code}"] title`); return p ? p.textContent.split(' :')[0].replace(/\s*\([^)]*\)\s*$/, '') : ''; };

/* ========== Ma commune ========== */
const commune = (() => {
  let lieu = null, crb = null, vitreFaite = false, modele = null, herbesCtl = null, coucherCtl = null, zoomer = null;
  const niveaux = () => { const v = M.vigilance; const n = {}; if (!v) return n; for (const [niv, , deps] of v.jours.aujourdhui) for (const d of deps) if (!n[d] || v.niveaux[niv] > v.niveaux[n[d]]) n[d] = niv; return n; };
  function seizeHTML(jours) {
    return jours.map((j, i) => `<li class="seize-jour${i === 0 ? ' seize-jour--auj' : ''}${j.pluie >= 1 ? ' seize-jour--pluie' : ''}"><p class="seize-date">${M.jourCourt(j.date, i)}</p>
      ${['matin', 'aprem'].map((k) => `<p class="seize-moment">${j[k] ? `${M.svgIcone(M.icone(j[k][1], 1))}<span class="visuellement-cache">${k === 'matin' ? 'Matin' : 'Après-midi'} </span><span>${M.deg(j[k][0])}</span>` : '<span>Non disponible</span>'}</p>`).join('')}
      <div class="seize-barre" role="img" style="--bas:${j.tmin};--haut:${j.tmax}" aria-label="De ${M.deg(j.tmin)} à ${M.deg(j.tmax)}"><span class="seize-min">${M.deg(j.tmin)}</span><span class="seize-piste"><i data-rail></i></span><span class="seize-max">${M.deg(j.tmax)}</span></div>
      <p class="seize-pluie">${j.pluie >= 1 ? '<span class="seize-gouttes" aria-hidden="true"><i></i><i></i></span>' : ''}${M.svgIcone('goutte', 'ico ico--mini')}${M.nombre(j.pluie)} mm</p></li>`).join('');
  }
  function etatPour(m) {
    const quand = m.direct ? new Date() : new Date(`${m.maj}:00+01:00`);
    return M.etatCiel(m.maintenant.code, m.maintenant.jour, M.hauteurSoleil(quand, m.lieu.lat, m.lieu.lon));
  }
  async function vitre(m) {
    if (vitreFaite) return; vitreFaite = true;
    const fig = $('[data-vitre]'), root = $('[data-pluie]');
    const e = etatPour(m);
    const fond = $('.pluie__fond', root);
    const actuelle = $('figure', fond);
    if (!$(`img[src*="ciel-${e}-"]`, fond)) {
      const f = figureCiel(e, { active: true, priorite: true }); f.classList.add('vitre-photo'); f.style.setProperty('--cadrage', '50% 60%');
      const img = $('img', f); $('img', f).alt = 'Le ciel du moment, vu par la fenêtre (illustration)';
      img.sizes = '(max-width: 860px) 100vw, 46vw';
      fond.appendChild(f); actuelle && actuelle.remove();
      await new Promise((ok) => { if (img.complete && img.naturalWidth) ok(); else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true }); } });
    }
    fig.classList.toggle('vitre--givre', m.maintenant.t < 1 || e === 'neige');
    fig.classList.toggle('vitre--soleil', e === 'clair' || e === 'crepuscule');
    const intensite = { pluie: 1, orage: 1, neige: 0.3, nuageux: 0.42, brouillard: 0.3, nuit: 0.28, crepuscule: 0.2, clair: 0.12 }[e] ?? 0.35;
    try { await initPluie(root, { intensite, buee: true, eclaircie: true, focus: [0.5, 0.6] }); } catch (err) { console.warn('[vitre]', err); }
  }
  function appliquer(m, { anime = true } = {}) {
    modele = m;
    const mt = m.maintenant, j0 = m.jours[0];
    texte('lieu', m.lieu.nom);
    texte('dep', m.lieu.dep ? `département ${m.lieu.dep}` : 'position choisie');
    texte('libelle', M.libelle(mt.code)); texte('ressenti', M.deg(mt.ressenti)); texte('tmin', M.deg(j0.tmin)); texte('tmax', M.deg(j0.tmax));
    texte('maj', majTexte(m.maj, m.direct)); texte('source', 'données Open-Meteo');
    texte('vent', mt.vent); texte('rafales', mt.rafales); texte('dirTexte', M.ventDe(mt.dir));
    texte('lever', M.heureFr(j0.lever)); texte('coucher', M.heureFr(j0.coucher));
    const [lh, lm] = j0.lever.split(':').map(Number), [ch, cm] = j0.coucher.split(':').map(Number), d = ch * 60 + cm - lh * 60 - lm;
    texte('jourDuree', `${Math.floor(d / 60)} h ${String(d % 60).padStart(2, '0')} de jour`);
    remplacerIcone($('.vitre-page .ciel-libelle svg'), M.icone(mt.code, mt.jour));
    const temp = $('[data-rouleaux]'); rouleaux(temp, M.deg(mt.t), { animer: anime });
    crb && crb.regler(m.heures);
    const lh2 = $('[data-heures]'); if (lh2) lh2.innerHTML = listeHeuresHTML(m.heures);
    const sz = $('[data-seize]');
    if (sz) { const ts = m.jours.flatMap((j) => [j.tmin, j.tmax]); sz.style.setProperty('--tmin', Math.min(...ts)); sz.style.setProperty('--tmax', Math.max(...ts)); sz.innerHTML = seizeHTML(m.jours); }
    const raf = $('[data-rafales]'); if (raf) raf.innerHTML = m.heures.slice(0, 12).map((h) => `<li style="--r:${Math.min(1, (h.raf || 0) / 60)}"><i></i><span>${+h.h} h</span></li>`).join('');
    rose.regler(mt.dir);
    herbesCtl && herbesCtl.regler(mt.vent, mt.dir);
    coucherCtl && coucherCtl.regler(m.lieu, j0);
    vigLocale(m.lieu.dep);
    document.title = `${m.lieu.nom} : météo en direct et 16 jours · MétéoFR`;
    ST() && ST().refresh();
  }
  /* Rose des vents : la flèche s'oriente, les branches se dessinent. */
  const rose = { el: null, dir: 0, regler(d) { this.dir = d; if (!this.el) return; if (calme()) { this.el.style.setProperty('--dir', `${d}deg`); return; } gsap.to(this.o, { a: d, duration: 1.6, ease: 'elastic.out(1, .5)', onUpdate: () => this.el.setAttribute('transform', `rotate(${this.o.a} 150 150)`) }); }, o: { a: 0 } };
  /* Arc solaire : le soleil glisse jusqu'à sa position de l'heure (heure de Paris). */
  const arc = {
    el: null, t: { k: 0 }, cible: 0,
    regler(lever, coucher, heureFixe) {
      const svg = this.el; if (!svg) return;
      const mn = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
      const n = M.maintenantParis(), maintenant = heureFixe ? mn(heureFixe) : n.h * 60 + n.m;
      this.cible = Math.max(0, Math.min(1, (maintenant - mn(lever)) / (mn(coucher) - mn(lever))));
      this.nuit = maintenant < mn(lever) || maintenant > mn(coucher);
      this.poser(calme() ? this.cible : this.t.k);
      if (!calme() && this.vu) gsap.to(this.t, { k: this.cible, duration: 1.8, ease: 'power2.out', onUpdate: () => this.poser(this.t.k) });
    },
    poser(k) {
      const a = Math.PI * (1 - k);
      const s = $('[data-arc-soleil]', this.el.closest('figure'));
      s.setAttribute('cx', (300 + Math.cos(a) * 240).toFixed(1)); s.setAttribute('cy', (260 - Math.sin(a) * 220).toFixed(1));
      s.style.opacity = this.nuit ? 0.35 : 1;
    },
  };
  function vigLocale(dep) {
    const svg = $('.france--locale'); if (!svg) return;
    const n = niveaux()[dep] || 'vert';
    $$('.dep--ici', svg).forEach((p) => p.classList.remove('dep--ici'));
    const p = dep && $(`[data-dep="${dep}"]`, svg);
    const niv = $('[data-vig-niveau]'), det = $('[data-vig-detail]');
    niv.className = `vig-niveau vig-niveau--${n}`; niv.textContent = { vert: 'Pas de vigilance particulière', jaune: 'Vigilance jaune', orange: 'Vigilance orange', rouge: 'Vigilance rouge' }[n];
    det.textContent = dep ? `Département\u00a0: ${nomDep(dep) || dep} (${dep}).` : 'Département non précisé pour cette position.';
    if (!p) return;
    p.classList.add('dep--ici');
    const b = p.getBBox(), m = 26;
    const vb = `${(b.x - m).toFixed(1)} ${(b.y - m).toFixed(1)} ${(b.width + 2 * m).toFixed(1)} ${(b.height + 2 * m).toFixed(1)}`;
    if (!svg.__plein) svg.__plein = `0 0 ${svg.viewBox.baseVal.width} ${svg.viewBox.baseVal.height}`;
    if (!zoomer) zoomer = V.zoomDepartement(svg, $('#vigilance'));
    zoomer(vb, svg.__plein);
  }
  function favoris() {
    const bouton = $('[data-favori]'), liste = $('[data-favoris]');
    const lire = () => { try { return JSON.parse(localStorage.getItem('meteofr:favoris') || '[]').filter((f) => f && f.nom); } catch { return []; } };
    const ecrire = (l) => { try { localStorage.setItem('meteofr:favoris', JSON.stringify(l.slice(0, 8))); } catch {} };
    const rendre = () => {
      const f = lire(), ici = f.some((x) => x.nom === lieu.nom && Math.abs(x.lat - lieu.lat) < 0.01);
      bouton.setAttribute('aria-pressed', String(ici));
      $('[data-favori-libelle]', bouton).textContent = ici ? 'Retirer des favoris' : 'Ajouter aux favoris';
      liste.innerHTML = f.map((x) => `<li><a href="${M.lienCommune(x)}" data-libelle="Ma commune">${x.nom}</a></li>`).join('');
      liste.hidden = !f.length;
    };
    bouton.addEventListener('click', () => {
      const f = lire(); const i = f.findIndex((x) => x.nom === lieu.nom && Math.abs(x.lat - lieu.lat) < 0.01);
      if (i >= 0) f.splice(i, 1); else f.unshift({ nom: lieu.nom, lat: lieu.lat, lon: lieu.lon, dep: lieu.dep || '' });
      ecrire(f); rendre();
    });
    rendre();
  }
  return {
    preparer() {
      lieu = M.lieuDeLAdresse() || M.lieuMemorise() || M.releve.lieu;
      const estReleve = Math.abs(lieu.lat - M.releve.lieu.lat) < 0.01 && Math.abs(lieu.lon - M.releve.lieu.lon) < 0.01;
      crb = E.courbe($('[data-courbe]'));
      rose.el = $('[data-rose-fleche]');
      arc.el = $('[data-arc] svg');
      if (rose.el && !calme()) { rose.el.style.transform = ''; rose.el.setAttribute('transform', 'rotate(-90 150 150)'); rose.o.a = -90; }
      if (!calme()) {
        ST().create({ trigger: '[data-rose]', start: 'top 80%', once: true, onEnter: () => { rose.vu = true; rose.regler(rose.dir); } });
        gsap.fromTo('.rose-branche', { scale: 0, svgOrigin: '150 150' }, { scale: 1, svgOrigin: '150 150', duration: 0.9, stagger: 0.06, ease: 'back.out(1.6)', scrollTrigger: { trigger: '[data-rose]', start: 'top 80%', once: true } });
        gsap.fromTo('.arc-trajet', { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: '[data-arc]', start: 'top 80%', once: true } });
        ST().create({ trigger: '[data-seize]', start: 'top 85%', once: true, onEnter: () => gsap.fromTo('[data-seize] [data-rail]', { scaleX: 0 }, { scaleX: 1, duration: 1, stagger: 0.05, ease: 'power3.out' }) });
        ST().create({ trigger: '[data-rafales]', start: 'top 90%', once: true, onEnter: () => gsap.fromTo('[data-rafales] i', { scaleY: 0 }, { scaleY: 1, duration: 0.8, stagger: 0.04, ease: 'power3.out' }) });
        gsap.fromTo('[data-vitre]', { y: 0 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '[data-commune]', start: 'top top', end: 'bottom top', scrub: true } });
      }
      coucherCtl = V.coucher($('[data-soleil]'), { lieu, jour: M.releve.jours[0] });
      V.herbes($('[data-effet="herbes-au-vent"]')).then((c) => { herbesCtl = c; const mt = (modele || M.releve).maintenant; c.regler(mt.vent, mt.dir); });
      E.initRecherche($('#recherche'));
      favoris();
      if (estReleve) { appliquer({ ...M.releve, lieu: { ...M.releve.lieu, ...lieu } }, { anime: false }); }
      else {
        texte('lieu', lieu.nom); texte('dep', lieu.dep ? `département ${lieu.dep}` : 'position choisie');
        ['t', 'libelle', 'ressenti', 'tmin', 'tmax'].forEach((k) => texte(k, '–'));
        texte('maj', 'Chargement des données en direct…'); texte('source', 'Open-Meteo');
        rouleaux($('[data-rouleaux]'), '–', { animer: false });
      }
      M.memoriserLieu(lieu);
      M.previsions(lieu).then((m) => {
        if (m) { appliquer(m); vitre(m); }
        else {
          if (!estReleve) texte('maj', 'Données en direct indisponibles pour le moment.');
          vitre({ ...M.releve, lieu });
        }
      });
      if (M.vigilance && M.maintenantParis().date > M.vigilance.releve.slice(0, 10)) $$('[data-releve-passe]').forEach((e) => { e.hidden = false; });
    },
    intro(tl, t) {
      montee(tl, '.vitre-titre, .vitre-mesure, .vitre-outils', t - 0.1);
      tl.fromTo('[data-vitre]', { clipPath: 'inset(100% 0 0 0 round 26px)' }, { clipPath: 'inset(0% 0 0 0 round 26px)', duration: 1, ease: 'power4.out' }, t - 0.25);
    },
    arrivee() { const tl = gsap.timeline(); commune.intro(tl, 0.25); },
    etatFinal() { gsap && gsap.set('[data-vitre]', { clearProps: 'clipPath' }); },
  };
})();

/* ========== Radar & carte ========== */
const radar = (() => {
  let r = null, lecture = true, i = 0, accum = 0, pause = 0;
  const bouton = () => $('[data-radar-lecture]'), curseur = () => $('[data-radar-curseur]');
  function regler(lit) {
    lecture = lit;
    const b = bouton(); if (!b) return;
    b.setAttribute('aria-pressed', String(lit));
    $('[data-radar-lib]', b).textContent = lit ? 'Pause' : 'Lecture';
    $('[data-radar-ico]', b).innerHTML = M.svgIcone(lit ? 'pause' : 'lecture');
  }
  function balayage() {
    const f = $('[data-faisceau]');
    if (calme() || !f) { r.revele = 1; r.dessiner(i, true); return; }
    r.revele = 0;
    const o = { k: 0 };
    gsap.timeline()
      .set(f, { opacity: 1, rotation: 0 })
      .to(f, { rotation: 360, duration: 2.2, ease: 'power1.inOut' }, 0)
      .to(o, { k: 1, duration: 2.2, ease: 'power1.inOut', onUpdate: () => { r.revele = o.k; r.dessiner(i, true); } }, 0)
      .to(f, { opacity: 0, duration: 0.5 }, 1.9);
  }
  function calques() {
    const carte = $('[data-calques]'); if (!carte) return;
    let moment = 'direct';
    const chaleur = V.carteChaleur(carte);
    const peindre = () => {
      $$('.marqueur', carte).forEach((a) => {
        const [t, code, jour] = (a.dataset[moment] || '').split('|');
        if (t === undefined || t === '') return;
        a.querySelector('[data-mq-t]').textContent = M.deg(+t);
        remplacerIcone(a.querySelector('svg'), M.icone(+code, +jour));
        a.style.setProperty('--teinte', M.teinte(+t));
        a.setAttribute('aria-label', `${a.dataset.ville} : ${M.deg(+t)}, ${M.libelle(+code)}`);
      });
      $('[data-calques-etat]').textContent = { direct: 'En direct\u00a0: conditions actuelles.', matin: 'Matin\u00a0: prévision de 9\u00a0h.', aprem: 'Après-midi\u00a0: prévision de 15\u00a0h.' }[moment];
      chaleur.regler(moment);
    };
    $$('[data-moments] button').forEach((b) => b.addEventListener('click', () => {
      moment = b.dataset.moment; $$('[data-moments] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); peindre();
      if (!calme()) gsap.fromTo($$('.marqueur', carte), { scale: 0.6 }, { scale: 1, duration: 0.5, stagger: 0.02, ease: 'back.out(2)' });
    }));
    $$('[data-fonds] button').forEach((b) => b.addEventListener('click', () => { carte.dataset.fond = b.dataset.fond; $$('[data-fonds] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
    peindre();
    if (!calme()) gsap.fromTo($$('.marqueur', carte), { scale: 0.4 }, { scale: 1, duration: 0.6, stagger: { each: 0.04, from: 'random' }, ease: 'back.out(1.8)', scrollTrigger: { trigger: carte, start: 'top 75%', once: true } });
    const villes = $$('.marqueur', carte).map((a) => { const v = M.releve.villes.find((x) => x.nom === a.dataset.ville); return { nom: v.nom, lat: v.lat, lon: v.lon, a }; });
    M.villesEnDirect(villes).then((res) => {
      if (!res) return;
      res.forEach((v, k) => { const a = villes[k].a; a.dataset.direct = `${v.t}|${v.code}|${v.jour}`; if (v.matin) a.dataset.matin = `${v.matin[0]}|${v.matin[1]}|1`; if (v.aprem) a.dataset.aprem = `${v.aprem[0]}|${v.aprem[1]}|1`; });
      peindre();
    });
  }
  return {
    preparer() {
      const sec = $('[data-radar-page]');
      r = new Radar($('.radar-scene', sec), { etiquette: $('[data-radar-heure]', sec), message: $('[data-radar-message]', sec) });
      A.radarEcran($('.radar-scene', sec), { lieu: M.lieuMemorise() || M.releve.lieu });
      V.averse($('[data-lire]'));
      regler(!calme());
      r.charger().then((ok) => {
        const n = r.images.length;
        const c = curseur(); c.max = Math.max(0, n - 1); c.value = c.max; i = Math.max(0, n - 1);
        if (!ok) { c.disabled = true; bouton().disabled = true; }
        r.dessiner(i, true);
        if (etat.pret) balayage(); else window.addEventListener('socle:pret', balayage, { once: true });
      });
      bouton().addEventListener('click', () => regler(!lecture));
      curseur().addEventListener('input', (e) => { regler(false); i = +e.target.value; r.dessiner(i, true); });
      boucle($('.radar-scene', sec), (dt) => {
        if (!lecture || !r.images.length || r.revele < 1) return;
        if (pause > 0) { pause -= dt; return; }
        accum += dt;
        if (accum > 0.55) { accum = 0; i = (Math.round(i) + 1) % r.images.length; if (i === r.images.length - 1) pause = 1.4; curseur().value = i; r.dessiner(i, true); }
      });
      calques();
      if (!calme()) gsap.fromTo('.echelle-pluie i', { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.echelle-pluie', start: 'top 85%', once: true } });
    },
    intro(tl, t) {
      tl.fromTo('.radar-scene .france', { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'power3.out' }, t - 0.5);
      montee(tl, '.radar-titre, .radar-commandes', t - 0.1);
    },
    arrivee() { const tl = gsap.timeline(); radar.intro(tl, 0.5); },
  };
})();

/* ========== Vigilance ========== */
const vigilance = (() => ({
  preparer() {
    const carte = $('[data-vig-carte]');
    const svg = $('svg', carte);
    const jours = { aujourdhui: JSON.parse(carte.dataset.auj), demain: JSON.parse(carte.dataset.dem) };
    const libelles = { vert: 'Pas de vigilance particulière', jaune: 'Vigilance jaune', orange: 'Vigilance orange', rouge: 'Vigilance rouge' };
    const rang = { vert: 0, jaune: 1, orange: 2, rouge: 3 };
    const montrer = (j, anime) => {
      const n = jours[j];
      $$('.dep', svg).forEach((p, k) => {
        const niv = n[p.dataset.dep];
        p.classList.remove('dep--jaune', 'dep--orange', 'dep--rouge');
        if (niv) p.classList.add('dep--' + niv);
        p.style.transitionDelay = anime && !calme() ? `${(+p.dataset.cy / 330) * 0.8}s` : '0s';
        const t = p.querySelector('title'); if (t) t.textContent = t.textContent.split(' :')[0] + (niv ? ` : vigilance ${niv}` : '');
      });
      const max = Object.values(n).reduce((m, x) => (rang[x] > rang[m] ? x : m), 'vert');
      const b = $('[data-vig-max]'); b.className = `vig-niveau vig-niveau--${max}`; b.textContent = libelles[max];
      $$('[data-vig-liste]').forEach((ul) => { ul.hidden = ul.dataset.vigListe !== j; });
      $$('[data-vig-jours] button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.jour === j)));
    };
    $$('[data-vig-jours] button').forEach((b) => b.addEventListener('click', () => { montrer(b.dataset.jour, true); const u = new URL(location.href); u.searchParams.set('jour', b.dataset.jour); history.replaceState(null, '', u); }));
    const demande = new URLSearchParams(location.search).get('jour');
    if (demande === 'demain') montrer('demain', false);
    A.encre(svg, { declencheur: carte });
    V.survolVigilance(svg, carte.parentElement);
    V.planches($('[data-planches]'));
    if (!calme()) {
      const voile = gsap.fromTo('[data-crue-voile]', { scaleY: 1 }, { scaleY: 0, ease: 'none', scrollTrigger: { trigger: '.crue-bandeau', start: 'top 85%', end: 'center 40%', scrub: true } });
      V.crue($('.crue-photo'), $('[data-crue]')).then((ok) => { if (ok) { voile.scrollTrigger && voile.scrollTrigger.kill(); gsap.set('[data-crue-voile]', { scaleY: 0 }); } else gsap.fromTo('.crue-photo img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.crue-bandeau', start: 'top bottom', end: 'bottom top', scrub: true } }); });
    }
    if (M.vigilance && M.maintenantParis().date > M.vigilance.releve.slice(0, 10)) $$('[data-releve-passe]').forEach((e) => { e.hidden = false; });
  },
  intro(tl, t) {
    montee(tl, '.nuancier-titre, .nuancier-resume, .nuancier-texte .actions', t - 0.1);
    const pleines = $$('.bande.est-pleine .bande-remplie');
    tl.fromTo($$('.bande'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 }, t - 0.3);
    if (pleines.length) tl.fromTo(pleines, { scaleY: 0 }, { scaleY: 1, duration: 1.1, stagger: 0.5, ease: 'power2.inOut' }, t + 0.1);
    tl.add(() => $$('.bande.est-niveau').forEach((b) => b.classList.add('pulse')), t + 0.2 + pleines.length * 0.5 + 0.6);
  },
  arrivee() { const tl = gsap.timeline(); vigilance.intro(tl, 0.35); },
}))();

/* ========== Application ========== */
let emergenceCtl = null;
const application = (() => ({
  preparer() {
    emergenceCtl = V.emergence($('[data-emergence]'));
    V.telephoneFonctions($('[data-fonctions]'));
    V.installation($('[data-installer]'));
    if (!calme()) {
      gsap.fromTo('[data-telephone-emergence]', { y: 0 }, { y: -90, ease: 'none', scrollTrigger: { trigger: '[data-emergence]', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.fromTo('.emergence-fond img', { yPercent: 0 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '[data-emergence]', start: 'top top', end: 'bottom top', scrub: true } });
    }
    const l = M.lieuMemorise() || M.releve.lieu;
    M.previsions(l).then((m) => {
      if (!m) return;
      $$('.telephone--emergence [data-m="t"]').forEach((e) => { e.textContent = M.deg(m.maintenant.t); });
      $$('.telephone--emergence [data-m="libelle"]').forEach((e) => { e.textContent = M.libelle(m.maintenant.code); });
      const lieuEl = $('.telephone--emergence .ea-lieu'); if (lieuEl) lieuEl.textContent = m.lieu.nom;
      remplacerIcone($('.telephone--emergence .ea-lib svg'), M.icone(m.maintenant.code, m.maintenant.jour));
      const ecr = $('.telephone--emergence [data-ecran-etat]'); if (ecr) ecr.dataset.ecranEtat = M.etatCiel(m.maintenant.code, m.maintenant.jour);
    });
  },
  intro(tl, t) {
    tl.fromTo('[data-telephone-emergence]', { yPercent: 70 }, { yPercent: 0, duration: 1.3, ease: 'power3.out' }, t - 0.4);
    if (emergenceCtl) emergenceCtl.intro(tl, t);
    montee(tl, '.emergence-contenu > *', t - 0.1, { stagger: 0.08 });
  },
  arrivee() { const tl = gsap.timeline(); application.intro(tl, 0.45); },
}))();

/* ========== Contact ========== */
const contact = (() => ({
  preparer() {
    const ciel = $('[data-contact-ciel]');
    const img = $('img', ciel);
    if (!calme()) boucle(ciel, (dt, t) => { img.style.transform = `translate3d(0, ${(Math.sin(t * 0.5) * 10).toFixed(2)}px, 0) scale(1.06)`; });
    const f = $('[data-formulaire]'), ballon = $('[data-ballon]');
    V.ballonFormulaire(f);
    f.addEventListener('submit', () => setTimeout(() => {
      const b = f.querySelector('[type="submit"]');
      if (!b.disabled || calme()) return;
      gsap.fromTo(ballon, { opacity: 1, y: 0, x: 0, rotation: -4 }, { opacity: 0, y: -380, x: 40, rotation: 6, duration: 3, ease: 'power1.in' });
    }, 0));
  },
  intro(tl, t) {
    montee(tl, '.contact-titre, .contact-texte > p[data-anime], .formulaire', t - 0.1);
    tl.fromTo('[data-contact-ciel]', { clipPath: 'inset(100% 0 0 0 round 18px)' }, { clipPath: 'inset(0% 0 0 0 round 18px)', duration: 1.1, ease: 'power4.out' }, t - 0.3);
  },
  arrivee() { const tl = gsap.timeline(); contact.intro(tl, 0.3); },
  etatFinal() { gsap && gsap.set('[data-contact-ciel]', { clearProps: 'clipPath' }); },
}))();

export const pages = { commune, radar, vigilance, application, contact };
