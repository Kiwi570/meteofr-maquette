/* Rendu des composants avec les données en direct : même balisage que la génération (source/gabarits/meteo.mjs). */
import { deg, heureFr, jourCourt, libelle, icone, svgIcone, teinte } from './meteo.js?v=2';

export function courbeSVG(heures) {
  const W = 1000, H = 260, X0 = 24, X1 = W - 24, Y0 = 34, Y1 = 196;
  const ts = heures.map((h) => h.t); const min = Math.floor(Math.min(...ts)) - 1, max = Math.ceil(Math.max(...ts)) + 1;
  const x = (i) => X0 + (X1 - X0) * i / (heures.length - 1);
  const y = (t) => Y1 - (Y1 - Y0) * (t - min) / Math.max(1, max - min);
  const pts = heures.map((h, i) => [x(i), y(h.t)]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [e, f] = pts[i]; const m = (a + e) / 2; d += ` C${m.toFixed(1)} ${b.toFixed(1)} ${m.toFixed(1)} ${f.toFixed(1)} ${e.toFixed(1)} ${f.toFixed(1)}`; }
  const aire = `${d} L${X1} ${H - 40} L${X0} ${H - 40} Z`;
  const barres = heures.map((h, i) => { const bh = (h.pp || 0) / 100 * 34; return `<rect x="${(x(i) - 7).toFixed(1)}" y="${(H - 6 - bh).toFixed(1)}" width="14" height="${bh.toFixed(1)}" rx="3"/>`; }).join('');
  const reperes = heures.map((h, i) => (i % 3 === 0 ? `<text x="${x(i).toFixed(1)}" y="${H + 16}" text-anchor="middle">${+h.h} h</text><text class="courbe-t" x="${x(i).toFixed(1)}" y="${(y(h.t) - 12).toFixed(1)}" text-anchor="middle">${deg(h.t)}</text><circle cx="${x(i).toFixed(1)}" cy="${y(h.t).toFixed(1)}" r="4"/>` : '')).join('');
  return { svg: `<svg class="courbe-svg" viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="Courbe des températures et probabilité de pluie pour les 24 prochaines heures"><defs><linearGradient id="courbe-aire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--soleil)" stop-opacity=".38"/><stop offset="1" stop-color="var(--soleil)" stop-opacity="0"/></linearGradient></defs><g class="courbe-pluie">${barres}</g><path class="courbe-aire" d="${aire}" fill="url(#courbe-aire)"/><path class="courbe-trait" d="${d}" fill="none" vector-effect="non-scaling-stroke"/><g class="courbe-reperes">${reperes}</g><line class="courbe-curseur" x1="0" x2="0" y1="${Y0 - 20}" y2="${H - 6}"/></svg>`, x, y, W };
}

export const listeHeuresHTML = (heures) => heures.slice(0, 24).map((h) => `<li><span class="h">${+h.h} h</span>${svgIcone(icone(h.code, h.jour))}<strong>${deg(h.t)}</strong><span class="pp">${svgIcone('goutte', 'ico ico--mini')}${h.pp ?? 0} %</span></li>`).join('');

export function semainierHTML(jours) {
  return jours.map((j, i) => `<li class="jour${j.pluie >= 1 ? ' jour--pluie' : ' jour--sec'}" data-pluie="${j.pluie >= 1 ? 'oui' : 'non'}" data-flip-id="j${i}">
    <p class="jour-nom">${jourCourt(j.date, i)}</p>
    ${['matin', 'aprem'].map((k) => (j[k] ? `<div class="jour-moment" style="--teinte:${teinte(j[k][0])}"><span class="jour-h"><span class="visuellement-cache">${k === 'matin' ? 'Matin' : 'Après-midi'}, </span>${k === 'matin' ? '9\u00a0h' : '15\u00a0h'}</span>${svgIcone(icone(j[k][1], 1))}<strong>${deg(j[k][0])}</strong></div>` : '<div class="jour-moment jour-moment--vide"><span>Non disponible</span></div>')).join('')}
    <div class="thermo" role="img" style="--bas:${j.tmin};--haut:${j.tmax}" aria-label="De ${deg(j.tmin)} à ${deg(j.tmax)}"><i data-thermo></i></div>
    <p class="jour-minmax"><span>${deg(j.tmin)}</span> <span>${deg(j.tmax)}</span></p>
    <p class="jour-pluie">${svgIcone('goutte', 'ico ico--mini')}${String(j.pluie).replace('.', ',')} mm</p>
  </li>`).join('');
}

export function bandesHTML(jours) {
  return jours.map((j, i) => {
    const moy = (j.tmin + j.tmax) / 2, pluie = j.pluie >= 1;
    return `<li class="bande-j${pluie ? ' bande-j--pluie' : ''}${moy < 2 ? ' bande-j--froid' : ''}" style="--teinte:${teinte(moy)}"><button type="button" data-jour-i="${i}" aria-label="${jourCourt(j.date, i)}\u00a0: de ${deg(j.tmin)} à ${deg(j.tmax)}${pluie ? `, ${String(j.pluie).replace('.', ',')} mm` : ''}"><span class="bj-nom" aria-hidden="true">${jourCourt(j.date, i)}</span><span class="bj-t" aria-hidden="true">${deg(j.tmax)}</span>${pluie ? '<span class="bj-gouttes" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}</button></li>`;
  }).join('');
}

export function majTexte(maj, direct) {
  const h = heureFr(maj.slice(11, 16));
  return direct ? `Mis à jour à ${h}` : `Relevé du ${+maj.slice(8, 10)} ${['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][+maj.slice(5, 7) - 1]} à ${h}`;
}

export const remplacerIcone = (svg, nom) => { const u = svg && svg.querySelector('use'); if (u) u.setAttribute('href', `#i-${nom}`); };
export { libelle };
