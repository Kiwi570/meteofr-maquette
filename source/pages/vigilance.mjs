/* Vigilance : ouverture « nuancier » (trois bandes qui se remplissent jusqu'au niveau du jour), bandeau de crue
   dont le voile s'efface au défilement, carte aujourd'hui / demain, couleurs et bons réflexes, source officielle. */
import { html } from '../../outils/gabarit.mjs';
import { icone } from '../gabarits/icones.mjs';
import { heureFr, carteFrance, niveauxVigilance, listeVigilance, niveauMax, dateLongue } from '../gabarits/meteo.mjs';

export const page = { cle: 'vigilance', fichier: 'vigilance', imagePartage: 'grok/crue-1168.webp' };

export default (c) => {
  const v = c.donnees.vigilance;
  const auj = niveauxVigilance(c, 'aujourdhui'), dem = niveauxVigilance(c, 'demain');
  const max = niveauMax(c, 'aujourdhui');
  const compte = (n, niv) => Object.values(n).filter((x) => x === niv).length;
  const rang = { vert: 0, jaune: 1, orange: 2, rouge: 3 }[max];
  const date = dateLongue(v.releve), heure = heureFr(v.releve.slice(11, 16));
  return html`
<section class="nuancier-page" id="debut">
  <div class="conteneur nuancier-grille">
    <div class="nuancier-texte">
      <p class="surtitre">${c.t('vigilance.page.surtitre')}</p>
      <h1 class="nuancier-titre" data-anime="gsap">${c.t('vigilance.page.titre')}</h1>
      <p class="nuancier-resume" data-anime="gsap">${c.t('vigilance.page.resume', { niveau: c.s('vigilance.bandeau.' + max).toLowerCase(), orange: `${compte(auj, 'orange')} département${compte(auj, 'orange') > 1 ? 's' : ''}`, jaune: compte(auj, 'jaune') })}</p>
      <p class="actions" data-anime="gsap"><a class="bouton" href="#carte" data-action-principale data-survol="magnetique">${c.t('vigilance.page.voirCarte')}</a> <a class="bouton bouton--contour" href="https://vigilance.meteofrance.fr/fr" target="_blank" rel="noopener">${c.t('vigilance.officiel')}</a></p>
      <p class="note-demo" data-info-cle>${c.t('vigilance.releve', { date, heure })} <span data-releve-passe hidden>${c.t('vigilance.relevePasse')}</span></p>
    </div>
    <div class="nuancier" data-nuancier data-effet="nuancier" data-rang="${rang}" role="img" aria-label="${c.s('vigilance.page.nuancierAria', { niveau: c.s('vigilance.bandeau.' + max) })}">
      ${['jaune', 'orange', 'rouge'].map((n, i) => html`<div class="bande bande--${n}${i < rang ? ' est-pleine' : ''}"><span class="bande-remplie"></span><span class="bande-nom">${c.t('vigilance.niveau.' + n)}</span><span class="bande-sens">${c.t('vigilance.sens.' + n)}</span></div>`)}
    </div>
  </div>
  <div class="crue-bandeau" data-effet="crue-voile">
    ${c.media({ nom: 'grok/crue', alt: c.s('vigilance.page.crueAlt'), cadrage: '50% 55%', classe: 'crue-photo', sizes: '100vw' })}
    <div class="crue-voile" data-crue-voile aria-hidden="true"></div>
  </div>
</section>

<section class="vig-page conteneur" id="carte">
  <div class="tete-section tete-section--ligne">
    <div><p class="surtitre">${c.t('vigilance.page.carteSurtitre')}</p><h2 data-anime="lignes">${c.t('vigilance.page.carteTitre')}</h2></div>
    <div class="filtres" role="group" aria-label="${c.s('vigilance.page.jour')}" data-vig-jours>
      <button type="button" aria-pressed="true" data-jour="aujourdhui">${c.t('vigilance.page.aujourdhui')}</button>
      <button type="button" aria-pressed="false" data-jour="demain">${c.t('vigilance.page.demain')}</button>
    </div>
  </div>
  <div class="vig-page-grille">
    <div class="vig-carte" data-vig-carte data-effet="vague-vigilance" data-auj='${JSON.stringify(auj)}' data-dem='${JSON.stringify(dem)}'>${carteFrance(c, { niveaux: auj, classe: 'france--vigilance', aria: c.s('accueil.vigilance.carteAria') })}</div>
    <div>
      <p class="vig-niveau vig-niveau--${max}" data-vig-max>${c.t('vigilance.bandeau.' + max)}</p>
      <ul class="vig-liste" data-vig-liste="aujourdhui" data-anime="cascade">${listeVigilance(c, 'aujourdhui')}</ul>
      <ul class="vig-liste" data-vig-liste="demain" hidden>${listeVigilance(c, 'demain')}</ul>
    </div>
  </div>
</section>

<section class="couleurs conteneur" id="couleurs">
  <div>
    <p class="surtitre">${c.t('vigilance.page.couleursSurtitre')}</p>
    <h2 data-anime="lignes">${c.t('vigilance.page.couleursTitre')}</h2>
    <p class="couleur-vert" data-anime><span class="couleur-pastille" aria-hidden="true"></span>${c.t('vigilance.page.vert')}</p>
    <h3>${c.t('vigilance.page.reflexesTitre')}</h3>
    <ul class="reflexes" data-anime="cascade">
      <li>${icone('alerte')}${c.t('vigilance.page.r1')}</li>
      <li>${icone('goutte')}${c.t('vigilance.page.r2')}</li>
      <li>${icone('cible')}${c.t('vigilance.page.r3')}</li>
    </ul>
    <p class="note-demo">${c.t('vigilance.page.source')}</p>
  </div>
  ${c.media({ nom: 'grok/bottes', alt: c.s('vigilance.page.bottesAlt'), cadrage: '30% 60%', classe: 'couleurs-photo', sizes: '(max-width: 860px) 100vw, 40vw', attrs: 'data-anime="rideau"' })}
</section>
`;
};
