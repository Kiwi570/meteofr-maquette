/* Accueil « Ciel vivant ». Rendu avec le relevé figé ; assets/js/site.js le met à jour en direct. */
import { html, brut } from '../../outils/gabarit.mjs';
import { icone } from '../gabarits/icones.mjs';
import { deg, heureFr, releve, courbe, listeHeures, carteFrance, niveauxVigilance, listeVigilance, niveauMax, semainier, bandesChaleur, libelle, etatCiel, ico, lienCommune, dateLongue, teinte } from '../gabarits/meteo.mjs';

export const page = { cle: 'accueil', fichier: 'index', imagePartage: 'grok/ciel-clair-1168.webp', flip: true };

const VILLES_GALERIE = ['Paris', 'Metz', 'Lille', 'Marseille', 'Lyon', 'Bordeaux'];

export function recherche(c, { id = 'recherche', compact = false, principal = true } = {}) {
  return html`<form class="recherche${compact ? ' recherche--compacte' : ''}" role="search" action="${c.url('commune')}" method="get" data-recherche id="${id}">
  <label class="recherche-label" for="${id}-champ">${c.t('composants.rechercheLabel')}</label>
  <div class="recherche-ligne">
    <div class="recherche-champ">
      ${icone('loupe')}
      <input id="${id}-champ" name="nom" type="search" autocomplete="off" spellcheck="false" placeholder="${c.s('composants.recherchePlaceholder')}" role="combobox" aria-expanded="false" aria-controls="${id}-liste" aria-autocomplete="list" aria-describedby="${id}-aide">
    </div>
    <button class="bouton bouton--soleil" type="submit"${principal ? brut(' data-action-principale') : ''} data-survol="magnetique">${c.t('composants.rechercheBouton')}</button>
  </div>
  <ul class="recherche-liste" id="${id}-liste" role="listbox" aria-label="${c.s('composants.rechercheListe')}" hidden></ul>
  <p class="recherche-aide" id="${id}-aide"><button type="button" class="lien recherche-localiser" data-localiser>${icone('cible')}${c.t('composants.localiser')}</button><span class="recherche-etat" aria-live="polite" data-recherche-etat></span></p>
</form>`;
}

export default (c) => {
  const r = releve(c);
  const m = r.maintenant, j0 = r.jours[0];
  const etat = etatCiel(c, m.code, m.jour);
  const niveaux = niveauxVigilance(c);
  const max = niveauMax(c);
  const villes = VILLES_GALERIE.map((n) => r.villes.find((v) => v.nom === n));
  const tmin = Math.min(...r.jours.map((j) => j.tmin)), tmax = Math.max(...r.jours.map((j) => j.tmax));
  return html`
<div class="isobares" aria-hidden="true" data-effet="isobares"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none">${brut(Array.from({ length: 7 }, (_, i) => `<path d="M-50 ${120 + i * 130} C 250 ${80 + i * 130}, 650 ${180 + i * 130}, 1050 ${110 + i * 130}"/>`).join(''))}</svg></div>

<section class="ciel" id="ciel" data-rail="Le ciel" data-ciel data-etat="${etat}" data-plein-ecran>
  <div class="ciel-fond" data-ciel-fond aria-hidden="true">
    ${c.media({ nom: `grok/ciel-${etat}`, alt: '', cadrage: '50% 70%', cadrageMobile: '50% 60%', priorite: true, classe: 'ciel-photo est-active', sizes: '100vw' })}
  </div>
  <canvas class="ciel-nuages" data-audit-ignorer data-ciel-nuages data-effet="ciel-reel" aria-hidden="true"></canvas>
  <canvas class="ciel-calque" data-audit-ignorer data-ciel-calque data-effet="ciel-vivant" aria-hidden="true"></canvas>
  <div class="ciel-voile" aria-hidden="true"></div>
  <div class="ciel-contenu conteneur">
    <div class="ciel-gauche">
      <p class="surtitre surtitre--clair"><span class="pastille-direct" aria-hidden="true"></span>${c.t('accueil.ciel.surtitre')} · <span data-m="lieu">${r.lieu.nom}</span></p>
      <h1 class="ciel-titre"><span class="ciel-ligne" data-anime="gsap">${c.t('accueil.ciel.titre1')}</span> <span class="ciel-ligne" data-anime="gsap">${c.t('accueil.ciel.titre2')}</span></h1>
      <div class="ciel-recherche" data-anime="gsap">${recherche(c)}</div>
    </div>
    <div class="ciel-droite" data-anime="gsap">
      <p class="temp-geante" data-m="t" data-rouleaux>${deg(m.t)}</p>
      <p class="ciel-libelle">${ico(c, m.code, m.jour)}<span data-m="libelle">${libelle(c, m.code)}</span></p>
      <p class="ciel-details">${c.t('composants.ressenti')} <strong data-m="ressenti">${deg(m.ressenti)}</strong> · ${c.t('composants.mini')} <strong data-m="tmin">${deg(j0.tmin)}</strong> · ${c.t('composants.maxi')} <strong data-m="tmax">${deg(j0.tmax)}</strong></p>
      <p class="ciel-maj" data-info-cle><span data-m="maj">${c.t('composants.majA', { heure: heureFr(r.maj.slice(11, 16)) })}</span> · <span data-m="source">${c.t('composants.sourceReleve')}</span></p>
      <p><a class="lien-fleche" href="${lienCommune(c, r.lieu)}" data-m-lien="fiche" data-libelle="${c.libelle('commune')}">${c.t('accueil.ciel.fiche')}${icone('fleche')}</a></p>
    </div>
  </div>
  <p class="ciel-defiler" aria-hidden="true">${c.t('accueil.ciel.defiler')}</p>
</section>

<section class="maintenant" id="maintenant" data-rail="Maintenant">
  <canvas class="champ-vent" data-champ-vent data-effet="champ-de-vent" aria-hidden="true"></canvas>
  <div class="conteneur maintenant-cadre">
  <div class="tete-section">
    <p class="surtitre">${c.t('accueil.maintenant.surtitre')} · <span data-m="lieu">${r.lieu.nom}</span></p>
    <h2 data-anime="lignes">${c.t('accueil.maintenant.titre')}</h2>
  </div>
  <div class="maintenant-grille">
    <figure class="girouette" data-effet="girouette" data-dir="${m.dir}">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle class="girouette-cercle" cx="100" cy="100" r="88"/>
        ${brut(Array.from({ length: 36 }, (_, i) => `<line class="girouette-trait${i % 9 === 0 ? ' fort' : ''}" x1="100" y1="${i % 9 === 0 ? 10 : 14}" x2="100" y2="22" transform="rotate(${i * 10} 100 100)"/>`).join(''))}
        <text x="100" y="40" text-anchor="middle">N</text><text x="166" y="106" text-anchor="middle">E</text><text x="100" y="172" text-anchor="middle">S</text><text x="34" y="106" text-anchor="middle">O</text>
        <g class="girouette-fleche" data-girouette-fleche style="--dir:${m.dir}deg"><path d="M100 30 L112 100 L100 92 L88 100 Z"/><path class="queue" d="M100 170 L108 112 L100 118 L92 112 Z"/></g>
        <circle cx="100" cy="100" r="6"/>
      </svg>
      <figcaption><span class="girouette-indice">${c.t('accueil.maintenant.girouette')}</span><span data-m="dirTexte">${c.t('composants.ventDe', { dir: c.s('composants.dir.' + ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(m.dir / 45) % 8]) })}</span></figcaption>
    </figure>
    <ul class="jauges" data-effet="jauges">
      ${[['vent', m.vent, 'km/h', 80], ['rafales', m.rafales, 'km/h', 100], ['hum', m.hum, '%', 100], ['nuages', m.nuages, '%', 100], ['pluie', m.pluie, 'mm', 10], ['pression', m.pression, 'hPa', null]].map(([k, v, u, mx]) => html`<li class="jauge">
        <span class="jauge-nom">${c.t('composants.jauge.' + k)}</span>
        <span class="jauge-val"><strong data-m="${k}">${String(v).replace('.', ',')}</strong> ${u}</span>
        <span class="jauge-barre" aria-hidden="true"><i data-jauge="${k}" style="--v:${mx ? Math.min(1, v / mx) : Math.min(1, Math.max(0, (v - 980) / 60))}"></i></span>
      </li>`)}
    </ul>
    ${c.media({ nom: 'grok/station-meteo', alt: c.s('accueil.maintenant.alt'), cadrage: '30% 55%', classe: 'maintenant-photo', sizes: '(max-width: 760px) 100vw, 30vw', attrs: 'data-fx="parallaxe"' })}
  </div>
  </div>
</section>

<section class="heures heures--journee" id="heures" data-rail="24 heures" data-journee>
  <div class="heures-ciel" data-heures-ciel aria-hidden="true"><span class="heures-etoiles" data-heures-etoiles></span></div>
  <div class="conteneur">
    <div class="tete-section tete-section--ligne">
      <div><p class="surtitre">${c.t('accueil.heures.surtitre')} · <span data-m="lieu">${r.lieu.nom}</span></p>
      <h2 data-anime="lignes">${c.t('accueil.heures.titre')}</h2>
      <p class="tete-note">${c.t('accueil.heures.note')}</p></div>
      <div class="heures-affiche" data-heures-affiche data-effet="journee-acceleree" aria-hidden="true">
        <p class="ha-heure" data-ha="heure">${c.t('accueil.heures.maintenant')}</p>
        <p class="ha-temp" data-ha="t">${deg(r.heures[0].t)}</p>
        <p class="ha-lib">${ico(c, r.heures[0].code, r.heures[0].jour)}<span data-ha="lib">${libelle(c, r.heures[0].code)}</span> · <span data-ha="pp">${c.t('accueil.heures.pluie', { pp: r.heures[0].pp ?? 0 })}</span></p>
      </div>
    </div>
    <div class="courbe" data-courbe data-effet="courbe-24h" tabindex="0" role="region" aria-label="${c.s('composants.courbeAria')}">
      ${courbe(c, r.heures)}
      <p class="courbe-bulle" data-courbe-bulle aria-hidden="true"></p>
      <p class="courbe-indice">${c.t('accueil.heures.indice')}</p>
    </div>
    <div class="defile" tabindex="0" role="region" aria-label="${c.s('accueil.heures.region')}"><ul class="heures-liste" data-heures data-anime="cascade">${listeHeures(c, r.heures)}</ul></div>
  </div>
</section>

<section class="vigilance-accueil conteneur" id="vigilance" data-rail="Vigilance">
  <div class="vig-carte" data-effet="vague-vigilance" data-boucle-css>
    ${carteFrance(c, { niveaux, classe: 'france--vigilance', aria: c.s('accueil.vigilance.carteAria') })}
  </div>
  <div class="vig-texte">
    <p class="surtitre">${c.t('accueil.vigilance.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('accueil.vigilance.titre')}</h2>
    <p class="vig-niveau vig-niveau--${max}" data-anime>${c.t('vigilance.bandeau.' + max)}</p>
    <ul class="vig-liste" data-anime="cascade">${listeVigilance(c)}</ul>
    <p class="note-demo">${c.t('vigilance.releve', { date: dateLongue(c.donnees.vigilance.releve), heure: heureFr(c.donnees.vigilance.releve.slice(11, 16)) })} <span data-releve-passe hidden>${c.t('vigilance.relevePasse')}</span></p>
    <p class="actions">${c.lien('vigilance', { ancre: 'carte', classe: 'bouton', texte: c.t('accueil.vigilance.demain'), attrs: 'data-survol="magnetique"' })} <a class="bouton bouton--contour" href="https://vigilance.meteofrance.fr/fr" target="_blank" rel="noopener">${c.t('vigilance.officiel')}</a></p>
  </div>
</section>

<section class="radar-accueil ecran" id="radar" data-rail="Radar" data-radar data-radar-mode="defile" data-plein-ecran>
  <div class="conteneur radar-tete">
    <div><p class="surtitre surtitre--clair">${c.t('accueil.radar.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('accueil.radar.titre')}</h2></div>
    <p class="radar-heure" data-tient><span data-radar-heure>${c.t('radar.chargement')}</span></p>
  </div>
  <div class="radar-scene radar-scene--ecran" data-tient data-effet="radar-defile" data-boucle-css>
    ${carteFrance(c, { classe: 'france--contours', aria: c.s('accueil.radar.carteAria') })}
    <canvas class="radar-canvas" data-radar-canvas aria-hidden="true"></canvas>
    <p class="radar-message" data-radar-message hidden></p>
  </div>
  <div class="conteneur radar-pied" data-tient>
    <div class="radar-frise" aria-hidden="true"><i data-radar-progres></i></div>
    <p>${c.lien('radar', { classe: 'lien-fleche', texte: html`${c.t('accueil.radar.lien')}${icone('fleche')}` })} <span class="radar-credit">${c.t('commun.sourceRadarCourt')}</span></p>
  </div>
</section>

<section class="jours conteneur" id="jours" data-rail="16 jours">
  <div class="tete-section tete-section--ligne">
    <div><p class="surtitre">${c.t('accueil.jours.surtitre')} · <span data-m="lieu">${r.lieu.nom}</span></p>
    <h2 data-anime="lignes">${c.t('accueil.jours.titre')}</h2></div>
    <div class="filtres" role="group" aria-label="${c.s('accueil.jours.filtres')}" data-filtres-jours>
      <button type="button" aria-pressed="true" data-filtre="tous">${c.t('accueil.jours.tous')}</button>
      <button type="button" aria-pressed="false" data-filtre="non">${c.t('accueil.jours.secs')}</button>
      <button type="button" aria-pressed="false" data-filtre="oui">${c.t('accueil.jours.pluie')}</button>
    </div>
  </div>
  <ol class="bandes" data-bandes data-effet="bandes-chaleur" data-boucle-css aria-label="${c.s('accueil.jours.bandes')}">${bandesChaleur(c, r.jours)}</ol>
  <div class="defile" tabindex="0" role="region" aria-label="${c.s('accueil.jours.region')}"><ul class="semainier" data-semainier data-effet="thermo-rail" data-visuel style="--tmin:${tmin};--tmax:${tmax}">${semainier(c, r.jours)}</ul></div>
  <p class="tete-note">${c.t('accueil.jours.note')}</p>
</section>

<section class="villes" id="villes" data-rail="Grandes villes" data-villes>
  <div class="conteneur villes-tete">
    <p class="surtitre">${c.t('accueil.villes.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('accueil.villes.titre')}</h2>
  </div>
  <div class="piste villes-piste" data-galerie tabindex="0" role="region" aria-label="${c.s('accueil.villes.region')}">
    ${villes.map((v) => html`<a class="ville" href="${lienCommune(c, v)}" data-libelle="${c.libelle('commune')}" data-ville="${v.nom}" data-lat="${v.lat}" data-lon="${v.lon}" data-code="${v.code}" data-jour="${v.jour}" data-t="${v.t}">
      <canvas class="ville-ciel" data-mini-ciel data-effet="mini-ciels" aria-hidden="true"></canvas>
      <span class="ville-haut"><span class="ville-nom">${v.nom}</span><span class="ville-dep">${v.dep}</span></span>
      <span class="ville-bas">
        <strong class="ville-t" data-v="t">${deg(v.t)}</strong>
        <span class="ville-libelle">${ico(c, v.code, v.jour)}<span data-v="libelle">${libelle(c, v.code)}</span></span>
        <span class="ville-moments"><span>${c.t('composants.matin')} <b data-v="matin">${deg(v.matin[0])}</b></span><span>${c.t('composants.aprem')} <b data-v="aprem">${deg(v.aprem[0])}</b></span></span>
      </span>
    </a>`)}
  </div>
  <div class="galerie-progres" aria-hidden="true"><span></span></div>
</section>

<section class="appli" id="appli" data-rail="L'appli">
  ${c.media({ nom: 'grok/mer-de-nuages', alt: '', cadrage: '50% 60%', classe: 'appli-fond', sizes: '100vw', attrs: 'data-fx="parallaxe" data-fx-force="8"' })}
  <div class="conteneur appli-grille" data-telephone data-effet="telephone">
    <div class="appli-etapes">
      <p class="surtitre surtitre--clair">${c.t('accueil.appli.surtitre')}</p>
      <h2 data-anime="lignes">${c.t('accueil.appli.titre')}</h2>
      <ol class="etapes-appli">${[['chercher', 'loupe'], ['direct', 'soleil'], ['radar', 'pluie'], ['alertes', 'alerte']].map(([k, ic], i) => html`<li class="etape" data-etape="${i}">
        <p class="etape-ico">${icone(ic)}</p>
        <div><h3>${c.t('accueil.appli.' + k + '.titre')}</h3>
        <p>${c.t('accueil.appli.' + k + '.texte')}</p></div>
      </li>`)}</ol>
      <p class="actions" data-anime>${c.lien('application', { ancre: 'installer', classe: 'bouton bouton--soleil', texte: html`${icone('telecharger')}${c.t('accueil.appli.bouton')}`, attrs: 'data-survol="magnetique"' })}</p>
    </div>
    <div class="telephone-colonne">
      <div class="telephone" aria-hidden="true">
        <div class="telephone-ecran" data-ecran-etat="${etat}">
          <div class="ecran-app est-active" data-ecran="0"><p class="ea-titre">${c.site.nom}</p><p class="ea-champ">${icone('loupe')} <span data-tape="${r.lieu.nom}">${r.lieu.nom}</span></p><ul class="ea-sugg"><li>Paris (75)</li><li>Pau (64)</li><li>Pantin (93)</li></ul></div>
          <div class="ecran-app" data-ecran="1"><p class="ea-lieu">${r.lieu.nom}</p><p class="ea-temp" data-m="t">${deg(m.t)}</p><p class="ea-lib">${ico(c, m.code, m.jour)} <span data-m="libelle">${libelle(c, m.code)}</span></p><ul class="ea-heures">${r.heures.slice(0, 5).map((h) => html`<li><span>${+h.h} h</span>${ico(c, h.code, h.jour)}<b>${deg(h.t)}</b></li>`)}</ul></div>
          <div class="ecran-app ecran-app--radar" data-ecran="2" data-boucle-css>${carteFrance(c, { classe: 'france--mini', aria: '' })}<span class="ea-pluie"></span><span class="ea-pluie ea-pluie--2"></span><p class="ea-legende">${c.t('accueil.appli.ecranRadar')}</p></div>
          <div class="ecran-app" data-ecran="3"><p class="ea-alerte vig-niveau--${max}">${icone('alerte')} ${c.t('vigilance.bandeau.' + max)}</p><p class="ea-texte">${nomsCourts(c)}</p><p class="ea-texte ea-texte--doux">${c.t('accueil.appli.ecranAlerte')}</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="sources" id="sources" data-rail="Sources" data-sources>
  <div class="sonde" data-effet="radiosondage">
    ${c.media({ nom: 'grok/ballon-sonde', alt: c.s('accueil.sources.alt'), cadrage: '70% 40%', cadrageMobile: '70% 30%', classe: 'sonde-sol', sizes: '(max-width: 860px) 100vw, 50vw' })}
    <div class="sonde-ciel" data-sonde-ciel aria-hidden="true"></div>
    <div class="sonde-etoiles" data-sonde-etoiles aria-hidden="true"></div>
    <div class="sonde-ballon" data-sonde-ballon aria-hidden="true">
      <span class="sb-enveloppe" data-sonde-enveloppe></span>
      <span class="sb-eclat" data-sonde-eclat></span>
      <svg class="sb-parachute" data-sonde-parachute viewBox="0 0 40 30"><path d="M4 14 Q20 -2 36 14 Z"/><path class="sb-suspentes" d="M4 14 L20 30 M36 14 L20 30 M20 6 L20 30"/></svg>
      <span class="sb-fil"></span>
      <span class="sb-boite"></span>
    </div>
    <dl class="sonde-instruments" aria-hidden="true">
      <div><dt>${c.t('accueil.sources.altitude')}</dt><dd data-sonde="alt">30 000 m</dd></div>
      <div><dt>${c.t('accueil.sources.temperature')}</dt><dd data-sonde="t">−46 °C</dd></div>
      <div><dt>${c.t('accueil.sources.pression')}</dt><dd data-sonde="p">12 hPa</dd></div>
    </dl>
    <p class="visuellement-cache">${c.t('accueil.sources.sondeTexte')}</p>
  </div>
  <div class="conteneur sources-contenu">
    <p class="surtitre">${c.t('accueil.sources.surtitre')}</p>
    <p class="manifeste" data-anime="mots">${c.t('accueil.sources.manifeste')}</p>
    <ul class="sources-liste" data-anime="cascade">
      <li><strong>Open-Meteo</strong><span>${c.t('accueil.sources.openmeteo')}</span></li>
      <li><strong>Météo-France</strong><span>${c.t('accueil.sources.meteofrance')}</span></li>
      <li><strong>RainViewer</strong><span>${c.t('accueil.sources.rainviewer')}</span></li>
      <li><strong>IGN</strong><span>${c.t('accueil.sources.ign')}</span></li>
    </ul>
    <p class="actions">${c.lien('commune', { ancre: 'recherche', classe: 'bouton bouton--soleil', texte: c.t('accueil.sources.bouton'), attrs: 'data-survol="magnetique"' })} ${c.lien('radar', { classe: 'bouton bouton--contour', texte: c.t('accueil.sources.radar') })}</p>
  </div>
</section>
`;
};

function nomsCourts(c) {
  const v = c.donnees.vigilance.jours.aujourdhui.filter((x) => x[0] === 'orange');
  const f = c.donnees.france.departements;
  return v.length ? `${c.donnees.vigilance.phenomenes[v[0][1]]} : ${v[0][2].map((k) => (f.find((d) => d.code === k) || {}).nom).join(', ')}` : '';
}
