/* Ma commune : ouverture « vitre » (le ciel réel vu par la fenêtre), puis heure par heure, 16 jours, vent, soleil, vigilance.
   Une seule page pour toutes les communes : ?nom=…&lat=…&lon=…&dep=… ; sans paramètre, le dernier relevé de Paris. */
import { html, brut } from '../../outils/gabarit.mjs';
import { icone } from '../gabarits/icones.mjs';
import { deg, heureFr, releve, courbe, listeHeures, carteFrance, niveauxVigilance, libelle, etatCiel, ico, jourCourt, teinte, nomsDeps } from '../gabarits/meteo.mjs';
import { recherche } from './accueil.mjs';

export const page = { cle: 'commune', fichier: 'commune', imagePartage: 'grok/ciel-pluie-1168.webp' };

export default (c) => {
  const r = releve(c);
  const m = r.maintenant, j0 = r.jours[0];
  const etat = etatCiel(c, m.code, m.jour);
  const niveaux = niveauxVigilance(c);
  const tmin = Math.min(...r.jours.map((j) => j.tmin)), tmax = Math.max(...r.jours.map((j) => j.tmax));
  const [lh, lm] = j0.lever.split(':').map(Number), [ch, cm] = j0.coucher.split(':').map(Number);
  const duree = (ch * 60 + cm) - (lh * 60 + lm);
  return html`
<section class="vitre-page" id="debut" data-rail="Ma commune" data-commune>
  <div class="conteneur vitre-grille">
    <div class="vitre-texte">
      <p class="surtitre"><span class="pastille-direct" aria-hidden="true"></span>${c.t('commune.surtitre')} · <span data-m="dep">${c.t('commune.departement', { dep: r.lieu.dep })}</span></p>
      <h1 class="vitre-titre" data-anime="gsap"><span data-m="lieu">${r.lieu.nom}</span></h1>
      <div class="vitre-mesure" data-anime="gsap">
        <p class="vitre-temp" data-m="t" data-rouleaux>${deg(m.t)}</p>
        <div>
          <p class="ciel-libelle">${ico(c, m.code, m.jour)}<span data-m="libelle">${libelle(c, m.code)}</span></p>
          <p class="ciel-details">${c.t('composants.ressenti')} <strong data-m="ressenti">${deg(m.ressenti)}</strong> · ${c.t('composants.mini')} <strong data-m="tmin">${deg(j0.tmin)}</strong> · ${c.t('composants.maxi')} <strong data-m="tmax">${deg(j0.tmax)}</strong></p>
          <p class="ciel-maj" data-info-cle><span data-m="maj">${c.t('composants.majA', { heure: heureFr(r.maj.slice(11, 16)) })}</span> · <span data-m="source">${c.t('composants.sourceReleve')}</span></p>
        </div>
      </div>
      <div class="vitre-outils" data-anime="gsap">
        ${recherche(c, { compact: true })}
        <p class="favoris"><button type="button" class="bouton bouton--contour" data-favori aria-pressed="false">${icone('etoile')}<span data-favori-libelle>${c.t('commune.favoriAjouter')}</span></button></p>
        <ul class="favoris-liste" data-favoris aria-label="${c.s('commune.favorisListe')}"></ul>
      </div>
    </div>
    <figure class="vitre" data-vitre data-effet="vitre" data-boucle-css>
      <div class="pluie" data-pluie>
        <div class="pluie__fond">${c.media({ nom: `grok/ciel-${etat}`, alt: c.s('commune.vitreAlt'), cadrage: '50% 60%', priorite: true, classe: 'vitre-photo', sizes: '(max-width: 860px) 100vw, 46vw' })}</div>
        <canvas class="pluie__canvas" aria-hidden="true"></canvas>
        <div class="pluie__fige" aria-hidden="true"></div>
        <div class="vitre-givre" aria-hidden="true"></div>
        <div class="vitre-reflet" aria-hidden="true"></div>
      </div>
      <figcaption class="vitre-indice"><span class="indice-souris">${c.t('commune.indiceSouris')}</span><span class="indice-doigt">${c.t('commune.indiceDoigt')}</span></figcaption>
    </figure>
  </div>
</section>

<section class="heures heures--commune" id="heures" data-rail="24 heures">
  <div class="conteneur">
    <div class="tete-section tete-section--ligne">
      <div><p class="surtitre">${c.t('accueil.heures.surtitre')}</p><h2 data-anime="lignes">${c.t('commune.heures.titre')}</h2></div>
      <p class="tete-note">${c.t('commune.heures.note')}</p>
    </div>
    <div class="courbe" data-courbe data-effet="courbe-24h" tabindex="0" role="region" aria-label="${c.s('composants.courbeAria')}">${courbe(c, r.heures)}<p class="courbe-bulle" data-courbe-bulle aria-hidden="true"></p><p class="courbe-indice">${c.t('accueil.heures.indice')}</p></div>
    <div class="defile" tabindex="0" role="region" aria-label="${c.s('accueil.heures.region')}"><ul class="heures-liste" data-heures data-anime="cascade">${listeHeures(c, r.heures)}</ul></div>
  </div>
</section>

<section class="seize conteneur" id="jours" data-rail="16 jours">
  <div class="tete-section tete-section--ligne">
    <div><p class="surtitre">${c.t('accueil.jours.surtitre')}</p><h2 data-anime="lignes">${c.t('commune.jours.titre')}</h2></div>
    <p class="tete-note">${c.t('commune.jours.note')}</p>
  </div>
  <ol class="seize-liste" data-seize data-effet="thermo-rail" data-visuel data-boucle-css style="--tmin:${tmin};--tmax:${tmax}">${r.jours.map((j, i) => html`<li class="seize-jour${i === 0 ? ' seize-jour--auj' : ''}${j.pluie >= 1 ? ' seize-jour--pluie' : ''}">
    <p class="seize-date">${jourCourt(j.date, i)}</p>
    <p class="seize-moment">${j.matin ? html`${ico(c, j.matin[1], 1)}<span class="visuellement-cache">${c.t('composants.matin')} </span><span>${deg(j.matin[0])}</span>` : html`<span>${c.t('composants.nonDisponible')}</span>`}</p>
    <p class="seize-moment">${j.aprem ? html`${ico(c, j.aprem[1], 1)}<span class="visuellement-cache">${c.t('composants.aprem')} </span><span>${deg(j.aprem[0])}</span>` : html`<span>${c.t('composants.nonDisponible')}</span>`}</p>
    <div class="seize-barre" role="img" style="--bas:${j.tmin};--haut:${j.tmax}" aria-label="${c.s('composants.minmax', { min: deg(j.tmin), max: deg(j.tmax) })}"><span class="seize-min">${deg(j.tmin)}</span><span class="seize-piste"><i data-rail></i></span><span class="seize-max">${deg(j.tmax)}</span></div>
    <p class="seize-pluie">${j.pluie >= 1 ? brut('<span class="seize-gouttes" aria-hidden="true"><i></i><i></i></span>') : ''}${icone('goutte', 'ico ico--mini')}${String(j.pluie).replace('.', ',')} mm</p>
  </li>`)}</ol>
</section>

<section class="vent conteneur" id="vent" data-rail="Vent">
  <div class="vent-rose" data-effet="rose-des-vents">
    <svg viewBox="0 0 300 300" aria-hidden="true" data-rose>
      <circle class="rose-anneau" cx="150" cy="150" r="128"/><circle class="rose-anneau rose-anneau--fin" cx="150" cy="150" r="92"/><circle class="rose-anneau rose-anneau--fin" cx="150" cy="150" r="56"/>
      ${brut(['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'].map((d, i) => { const a = i * 45 * Math.PI / 180, R = i % 2 ? 108 : 120; return `<path class="rose-branche${i % 2 ? '' : ' forte'}" d="M150 150 L${(150 + Math.sin(a - 0.12) * 30).toFixed(1)} ${(150 - Math.cos(a - 0.12) * 30).toFixed(1)} L${(150 + Math.sin(a) * R).toFixed(1)} ${(150 - Math.cos(a) * R).toFixed(1)} L${(150 + Math.sin(a + 0.12) * 30).toFixed(1)} ${(150 - Math.cos(a + 0.12) * 30).toFixed(1)}Z"/><text x="${(150 + Math.sin(a) * 142).toFixed(1)}" y="${(155 - Math.cos(a) * 142).toFixed(1)}" text-anchor="middle">${d}</text>`; }).join(''))}
      <g class="rose-fleche" data-rose-fleche style="--dir:${m.dir}deg"><path d="M150 40 L162 150 L150 140 L138 150Z"/></g>
      <circle class="rose-centre" cx="150" cy="150" r="7"/>
    </svg>
  </div>
  <div class="vent-texte">
    <p class="surtitre">${c.t('commune.vent.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('commune.vent.titre')}</h2>
    <ul class="vent-chiffres" data-anime="cascade">
      <li><span>${c.t('composants.jauge.vent')}</span><strong><span data-m="vent">${m.vent}</span> km/h</strong></li>
      <li><span>${c.t('composants.jauge.rafales')}</span><strong><span data-m="rafales">${m.rafales}</span> km/h</strong></li>
      <li><span>${c.t('commune.vent.direction')}</span><strong data-m="dirTexte">${c.t('composants.ventDe', { dir: c.s('composants.dir.' + ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(m.dir / 45) % 8]) })}</strong></li>
    </ul>
    <p class="tete-note">${c.t('commune.vent.note')}</p>
    <ol class="rafales" data-rafales aria-label="${c.s('commune.vent.rafalesAria')}">${r.heures.slice(0, 12).map((h) => html`<li style="--r:${Math.min(1, (h.raf || 0) / 60)}"><i></i><span>${+h.h} h</span></li>`)}</ol>
  </div>
  ${c.media({ nom: 'grok/vent-herbes', alt: c.s('commune.vent.alt'), cadrage: '30% 60%', classe: 'vent-photo', sizes: '(max-width: 860px) 100vw, 30vw', attrs: 'data-effet="herbes-au-vent"' })}
</section>

<section class="soleil" id="soleil" data-rail="Soleil" data-soleil>
  ${c.media({ nom: 'grok/ciel-crepuscule', alt: c.s('commune.soleil.alt'), cadrage: '50% 70%', classe: 'soleil-fond', sizes: '100vw', attrs: 'data-fx="zoom"' })}
  <div class="soleil-ciel" data-soleil-ciel data-effet="coucher-de-soleil" aria-hidden="true"></div>
  <div class="soleil-etoiles" data-soleil-etoiles aria-hidden="true"></div>
  <div class="conteneur soleil-contenu">
    <div class="soleil-texte">
      <p class="surtitre surtitre--clair">${c.t('commune.soleil.surtitre')}</p>
      <h2 data-anime="lignes">${c.t('commune.soleil.titre')}</h2>
      <p class="soleil-duree"><span data-m="jourDuree">${c.t('commune.soleil.duree', { h: Math.floor(duree / 60), m: String(duree % 60).padStart(2, '0') })}</span></p>
    </div>
    <figure class="arc" data-arc data-effet="arc-solaire" data-lever="${j0.lever}" data-coucher="${j0.coucher}" data-releve="${r.maj.slice(11, 16)}">
      <svg viewBox="0 0 600 300" aria-hidden="true">
        <path class="arc-horizon" d="M20 260 H580"/>
        <path class="arc-trajet" d="M60 260 A240 220 0 0 1 540 260" fill="none"/>
        <g class="arc-maintenant" data-arc-maintenant><circle r="5"/><text y="-14" text-anchor="middle">${c.t('commune.soleil.maintenant')}</text></g>
        <circle class="arc-soleil" data-arc-soleil cx="60" cy="260" r="14"/>
      </svg>
      <p class="arc-heure" data-arc-heure aria-hidden="true">${heureFr(j0.lever)}</p>
      <figcaption><span>${c.t('commune.soleil.lever')} <strong data-m="lever">${heureFr(j0.lever)}</strong></span><span>${c.t('commune.soleil.coucher')} <strong data-m="coucher">${heureFr(j0.coucher)}</strong></span></figcaption>
    </figure>
  </div>
</section>

<section class="vig-locale conteneur" id="vigilance" data-rail="Vigilance">
  <div class="vig-zoom" data-effet="zoom-departement">${carteFrance(c, { niveaux, classe: 'france--locale', aria: c.s('commune.vigilance.carteAria') })}</div>
  <div class="vig-texte">
    <p class="surtitre">${c.t('commune.vigilance.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('commune.vigilance.titre')}</h2>
    <p class="vig-niveau vig-niveau--${niveaux[r.lieu.dep] || 'vert'}" data-vig-niveau data-anime>${c.t('vigilance.bandeau.' + (niveaux[r.lieu.dep] || 'vert'))}</p>
    <p data-vig-detail data-anime>${c.t('commune.vigilance.departement', { dep: nomsDeps(c, [r.lieu.dep]) })}</p>
    <p class="note-demo">${c.t('vigilance.releve', { date: '5 novembre 2026', heure: '15 h 20' })} <span data-releve-passe hidden>${c.t('vigilance.relevePasse')}</span></p>
    <p class="actions">${c.lien('vigilance', { ancre: 'carte', classe: 'bouton', texte: c.t('commune.vigilance.lien'), attrs: 'data-survol="magnetique"' })} <a class="bouton bouton--contour" href="https://vigilance.meteofrance.fr/fr" target="_blank" rel="noopener">${c.t('vigilance.officiel')}</a></p>
  </div>
</section>
`;
};
