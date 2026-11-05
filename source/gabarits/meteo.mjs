/* Rendu côté génération des composants météo, à partir du relevé figé (donnees/releve.json).
   Le JavaScript du site refait le même rendu avec les données en direct (assets/js/meteo.js). */
import { html, brut } from '../../outils/gabarit.mjs';
import { icone, iconeCode } from './icones.mjs';

export const deg = (t) => (t == null ? '–' : `${Math.round(t) < 0 ? '−' : ''}${Math.abs(Math.round(t))}°`);
export const heureFr = (hhmm) => { const [h, m] = hhmm.split(':'); return m && m !== '00' ? `${+h} h ${m}` : `${+h} h`; };
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const dateLongue = (iso) => { const d = new Date(iso.slice(0, 10) + 'T12:00:00'); return `${JOURS[d.getDay()]} ${d.getDate() === 1 ? '1er' : d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`; };
export const jourCourt = (iso, i) => { const d = new Date(iso + 'T12:00:00'); return i === 0 ? 'Auj.' : i === 1 ? 'Demain' : `${JOURS_COURTS[d.getDay()]} ${d.getDate()}`; };

/* Teinte d'une température (froid → bleu, doux → vert d'eau, chaud → orange, très chaud → rouge). */
const ECHELLE = [[-10, [59, 76, 192]], [0, [96, 150, 226]], [8, [120, 196, 214]], [14, [166, 214, 160]], [18, [246, 211, 107]], [24, [246, 164, 58]], [32, [211, 58, 44]]];
export function teinte(t) {
  if (t <= ECHELLE[0][0]) return `rgb(${ECHELLE[0][1]})`;
  for (let i = 1; i < ECHELLE.length; i++) {
    const [b, cb] = ECHELLE[i], [a, ca] = ECHELLE[i - 1];
    if (t <= b) { const k = (t - a) / (b - a); return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * k)).join(' ')})`; }
  }
  return `rgb(${ECHELLE[ECHELLE.length - 1][1]})`;
}

export const libelle = (c, code) => (c.donnees.codes[String(code)] || c.donnees.codes['3'])[0];
export function etatCiel(c, code, jour) {
  const e = (c.donnees.codes[String(code)] || c.donnees.codes['3'])[2];
  if (!jour && (e === 'clair' || e === 'nuageux')) return 'nuit';
  return e;
}
export const ico = (c, code, jour = 1, classe) => icone(iconeCode(c.donnees.codes, code, jour), classe);

/* Relevé figé, sous forme d'objets. */
export function releve(c) {
  const r = c.donnees.releve;
  const [t, ressenti, hum, jour, pluie, code, nuages, pression, vent, dir, rafales] = r.maintenant;
  return {
    maj: r.maj, lieu: { nom: r.lieu[0], dep: r.lieu[1], lat: r.lieu[2], lon: r.lieu[3] },
    maintenant: { t, ressenti, hum, jour, pluie, code, nuages, pression, vent, dir, rafales },
    heures: r.heures.map(([h, t, pp, p, code, jour, raf]) => ({ h, t, pp, p, code, jour, raf })),
    jours: r.jours.map(([date, code, tmin, tmax, pluie, pp, lever, coucher, matin, aprem]) => ({ date, code, tmin, tmax, pluie, pp, lever, coucher, matin, aprem })),
    villes: r.villes.map(([nom, dep, lat, lon, t, code, jour, matin, aprem]) => ({ nom, dep, lat, lon, t, code, jour, matin, aprem })),
  };
}

export const lienCommune = (c, v) => c.url('commune', '', `nom=${encodeURIComponent(v.nom)}&lat=${v.lat}&lon=${v.lon}&dep=${v.dep}`);

/* Courbe des 24 prochaines heures (SVG). */
export function courbe(c, heures) {
  const W = 1000, H = 260, X0 = 24, X1 = W - 24, Y0 = 34, Y1 = 196;
  const ts = heures.map((h) => h.t); const min = Math.floor(Math.min(...ts)) - 1, max = Math.ceil(Math.max(...ts)) + 1;
  const x = (i) => X0 + (X1 - X0) * i / (heures.length - 1);
  const y = (t) => Y1 - (Y1 - Y0) * (t - min) / Math.max(1, max - min);
  const pts = heures.map((h, i) => [x(i), y(h.t)]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [e, f] = pts[i]; const m = (a + e) / 2; d += ` C${m.toFixed(1)} ${b.toFixed(1)} ${m.toFixed(1)} ${f.toFixed(1)} ${e.toFixed(1)} ${f.toFixed(1)}`; }
  const aire = `${d} L${X1} ${H - 40} L${X0} ${H - 40} Z`;
  const barres = heures.map((h, i) => { const bh = (h.pp || 0) / 100 * 34; return `<rect x="${(x(i) - 7).toFixed(1)}" y="${(H - 6 - bh).toFixed(1)}" width="14" height="${bh.toFixed(1)}" rx="3"/>`; }).join('');
  const reperes = heures.map((h, i) => (i % 3 === 0 ? `<text x="${x(i).toFixed(1)}" y="${H + 16}" text-anchor="middle">${+h.h} h</text><text class="courbe-t" x="${x(i).toFixed(1)}" y="${(y(h.t) - 12).toFixed(1)}" text-anchor="middle">${deg(h.t)}</text><circle cx="${x(i).toFixed(1)}" cy="${y(h.t).toFixed(1)}" r="4"/>` : '')).join('');
  return brut(`<svg class="courbe-svg" viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="${c.s('composants.courbeAria')}"><defs><linearGradient id="courbe-aire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--soleil)" stop-opacity=".38"/><stop offset="1" stop-color="var(--soleil)" stop-opacity="0"/></linearGradient></defs><g class="courbe-pluie">${barres}</g><path class="courbe-aire" d="${aire}" fill="url(#courbe-aire)"/><path class="courbe-trait" d="${d}" fill="none" vector-effect="non-scaling-stroke"/><g class="courbe-reperes">${reperes}</g><line class="courbe-curseur" x1="0" x2="0" y1="${Y0 - 20}" y2="${H - 6}"/></svg>`);
}

export function listeHeures(c, heures) {
  return html`${heures.slice(0, 24).map((h) => html`<li><span class="h">${+h.h} h</span>${ico(c, h.code, h.jour)}<strong>${deg(h.t)}</strong><span class="pp">${icone('goutte', 'ico ico--mini')}${h.pp ?? 0} %</span></li>`)}`;
}

/* Carte des départements, colorés selon la vigilance (le niveau le plus haut du jour). */
export function niveauxVigilance(c, jour = 'aujourdhui') {
  const v = c.donnees.vigilance, n = v.niveaux, par = {};
  for (const [niveau, , deps] of v.jours[jour]) for (const d of deps) if (!par[d] || n[niveau] > n[par[d]]) par[d] = niveau;
  return par;
}
export function carteFrance(c, { niveaux = {}, classe = '', aria = '', villes = [] } = {}) {
  const f = c.donnees.france;
  const deps = f.departements.map((d) => `<path d="${d.d}" data-dep="${d.code}" data-cy="${d.cy}" class="dep${niveaux[d.code] ? ' dep--' + niveaux[d.code] : ''}"><title>${d.nom} (${d.code})${niveaux[d.code] ? ' : vigilance ' + niveaux[d.code] : ''}</title></path>`).join('');
  return brut(`<svg class="france ${classe}" viewBox="0 0 ${f.largeur} ${f.hauteur}" role="img" aria-label="${aria}" data-origine="${f.origine.join(',')}" data-zoom="${f.zoom}">${deps}${villes.join('')}</svg>`);
}
/* Position d'une ville sur la carte (même projection que france.json). */
export function surCarte(c, lat, lon) {
  const f = c.donnees.france, M = 256 * 2 ** f.zoom;
  const x = (lon + 180) / 360 * M; const s = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * M;
  return [x - f.origine[0], y - f.origine[1]];
}

export function nomsDeps(c, codes) {
  const f = c.donnees.france.departements;
  return codes.map((k) => { const d = f.find((x) => x.code === k); return d ? `${d.nom} (${k})` : k; }).join(', ');
}

export function listeVigilance(c, jour = 'aujourdhui') {
  const v = c.donnees.vigilance;
  return html`${v.jours[jour].map(([niveau, ph, deps]) => html`<li class="vig-item vig-item--${niveau}"><span class="vig-pastille" aria-hidden="true"></span><p><strong>${v.phenomenes[ph]}</strong> · ${c.t('vigilance.niveau.' + niveau)}<br><span>${nomsDeps(c, deps)}</span></p></li>`)}`;
}
export function niveauMax(c, jour = 'aujourdhui') {
  const v = c.donnees.vigilance; let m = 'vert';
  for (const [niveau] of v.jours[jour]) if (v.niveaux[niveau] > v.niveaux[m]) m = niveau;
  return m;
}

/* 16 jours : grille jours × matin / après-midi (semainier). */
export function semainier(c, jours) {
  return html`${jours.map((j, i) => html`<li class="jour${j.pluie >= 1 ? ' jour--pluie' : ' jour--sec'}" data-pluie="${j.pluie >= 1 ? 'oui' : 'non'}" data-flip-id="j${i}">
    <p class="jour-nom">${jourCourt(j.date, i)}</p>
    ${['matin', 'aprem'].map((k) => (j[k] ? html`<div class="jour-moment" style="--teinte:${teinte(j[k][0])}"><span class="jour-h"><span class="visuellement-cache">${c.t('composants.' + k)}, </span>${k === 'matin' ? '9 h' : '15 h'}</span>${ico(c, j[k][1], 1)}<strong>${deg(j[k][0])}</strong></div>` : html`<div class="jour-moment jour-moment--vide"><span>${c.t('composants.nonDisponible')}</span></div>`))}
    <div class="thermo" role="img" style="--bas:${j.tmin};--haut:${j.tmax}" aria-label="${c.s('composants.minmax', { min: deg(j.tmin), max: deg(j.tmax) })}"><i data-thermo></i></div>
    <p class="jour-minmax"><span>${deg(j.tmin)}</span> <span>${deg(j.tmax)}</span></p>
    <p class="jour-pluie">${icone('goutte', 'ico ico--mini')}${j.pluie} mm</p>
  </li>`)}`;
}
