/* Radar & carte : ouverture « balayage » (un faisceau parcourt la France et révèle la vraie pluie), puis la carte
   des prévisions à calques (direct, matin, après-midi ; températures ou vigilance), la lecture du radar et la FAQ. */
import { html, brut } from '../../outils/gabarit.mjs';
import { icone, iconeCode } from '../gabarits/icones.mjs';
import { deg, releve, carteFrance, niveauxVigilance, ico, surCarte, lienCommune } from '../gabarits/meteo.mjs';

export const page = { cle: 'radar', fichier: 'radar', imagePartage: 'grok/averse-au-loin-1168.webp' };

export default (c) => {
  const r = releve(c);
  const niveaux = niveauxVigilance(c);
  const marqueurs = r.villes.map((v) => {
    const [x, y] = surCarte(c, v.lat, v.lon);
    const secondaire = !['Paris', 'Lille', 'Strasbourg', 'Brest', 'Nantes', 'Bordeaux', 'Toulouse', 'Lyon', 'Marseille', 'Nice', 'Ajaccio', 'Metz'].includes(v.nom);
    return `<a class="marqueur${secondaire ? ' marqueur--secondaire' : ''}" href="${lienCommune(c, v)}" data-libelle="${c.s('pages.commune.nav')}" style="--x:${(x / c.donnees.france.largeur * 100).toFixed(2)}%;--y:${(y / c.donnees.france.hauteur * 100).toFixed(2)}%" data-ville="${v.nom}" data-direct="${v.t}|${v.code}|${v.jour}" data-matin="${v.matin[0]}|${v.matin[1]}|1" data-aprem="${v.aprem[0]}|${v.aprem[1]}|1"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-${iconeCode(c.donnees.codes, v.code, v.jour)}"/></svg><strong data-mq-t>${deg(v.t)}</strong><span class="marqueur-nom">${v.nom}</span></a>`;
  }).join('');
  return html`
<section class="radar-plein ecran" id="debut" data-radar-page data-plein-ecran>
  <div class="radar-plein-scene">
    <div class="radar-scene radar-scene--grande" data-effet="balayage" data-boucle-css>
      ${carteFrance(c, { classe: 'france--contours', aria: c.s('radar.carteAria') })}
      <canvas class="radar-canvas" data-radar-canvas aria-hidden="true"></canvas>
      <div class="faisceau" data-faisceau aria-hidden="true"></div>
      <p class="radar-message" data-radar-message hidden></p>
    </div>
  </div>
  <div class="conteneur radar-bandeau">
    <div>
      <p class="surtitre surtitre--clair">${c.t('radar.surtitre')}</p>
      <h1 class="radar-titre" data-anime="gsap">${c.t('radar.titre')}</h1>
    </div>
    <div class="radar-commandes" data-anime="gsap">
      <p class="radar-heure" data-info-cle><span data-radar-heure>${c.t('radar.chargement')}</span></p>
      <div class="radar-ligne">
        <button type="button" class="bouton bouton--soleil" data-radar-lecture data-action-principale aria-pressed="true"><span data-radar-ico>${icone('pause')}</span><span data-radar-lib>${c.t('radar.pause')}</span></button>
        <label class="visuellement-cache" for="radar-curseur">${c.t('radar.curseur')}</label>
        <input type="range" id="radar-curseur" class="radar-curseur" min="0" max="12" value="12" step="1" data-radar-curseur>
      </div>
      <p class="radar-credit">${c.t('commun.sourceRadarCourt')}</p>
    </div>
  </div>
</section>

<section class="calques conteneur" id="carte">
  <div class="tete-section tete-section--ligne">
    <div><p class="surtitre">${c.t('radar.calques.surtitre')}</p><h2 data-anime="lignes">${c.t('radar.calques.titre')}</h2></div>
    <div class="calques-commandes">
      <div class="filtres" role="group" aria-label="${c.s('radar.calques.moment')}" data-moments>
        <button type="button" aria-pressed="true" data-moment="direct">${c.t('radar.calques.direct')}</button>
        <button type="button" aria-pressed="false" data-moment="matin">${c.t('composants.matin')}</button>
        <button type="button" aria-pressed="false" data-moment="aprem">${c.t('composants.aprem')}</button>
      </div>
      <div class="filtres" role="group" aria-label="${c.s('radar.calques.fond')}" data-fonds>
        <button type="button" aria-pressed="true" data-fond="temperatures">${c.t('radar.calques.temperatures')}</button>
        <button type="button" aria-pressed="false" data-fond="vigilance">${c.t('pages.vigilance.nav')}</button>
      </div>
    </div>
  </div>
  <div class="calques-grille">
    <div class="calques-carte" data-calques data-effet="calques" data-fond="temperatures">
      <canvas class="chaleur" data-chaleur data-effet="carte-de-chaleur" aria-hidden="true"></canvas>
      ${carteFrance(c, { niveaux, classe: 'france--calques', aria: c.s('radar.calques.carteAria') })}
      <div class="marqueurs" data-marqueurs>${brut(marqueurs)}</div>
    </div>
    <div class="calques-legende">
      <p class="calques-etat" data-calques-etat aria-live="polite">${c.t('radar.calques.etatDirect')}</p>
      <p class="legende-temp"><span>${c.t('radar.calques.froid')}</span><i aria-hidden="true"></i><span>${c.t('radar.calques.chaud')}</span></p>
      <p class="legende-vig"><span class="vig-pastille"></span>${c.t('vigilance.niveau.jaune')} <span class="vig-pastille vig-pastille--orange"></span>${c.t('vigilance.niveau.orange')} <span class="vig-pastille vig-pastille--rouge"></span>${c.t('vigilance.niveau.rouge')}</p>
      <p class="tete-note">${c.t('radar.calques.note')}</p>
      <p class="note-demo">${c.t('radar.calques.vigNote')}</p>
    </div>
  </div>
</section>

<section class="lire conteneur" id="lire" data-lire>
  <div class="averse" data-averse data-effet="averse-en-marche" data-visuel>
    ${c.media({ nom: 'grok/averse-au-loin', alt: c.s('radar.lire.alt'), cadrage: '70% 50%', classe: 'averse-photo', sizes: '(max-width: 860px) 100vw, 50vw' })}
    <div class="averse-carte" aria-hidden="true">${carteFrance(c, { classe: 'france--averse', aria: '' })}</div>
    <div class="averse-cellule" data-cellule aria-hidden="true"><i class="ac-faible"></i><i class="ac-moderee"></i><i class="ac-forte"></i></div>
    <p class="averse-heure" data-averse-heure aria-hidden="true">${c.t('radar.lire.ilya')}</p>
  </div>
  <div>
    <p class="surtitre">${c.t('radar.lire.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('radar.lire.titre')}</h2>
    <p class="echelle-pluie" data-anime aria-hidden="true"><span data-niveau>${c.t('radar.lire.faible')}</span><i><b data-echelle-curseur></b></i><span data-niveau>${c.t('radar.lire.moderee')}</span><span data-niveau>${c.t('radar.lire.forte')}</span></p>
    <ol class="conseils" data-anime="cascade">
      <li><strong>${c.t('radar.lire.c1t')}</strong> ${c.t('radar.lire.c1')}</li>
      <li><strong>${c.t('radar.lire.c2t')}</strong> ${c.t('radar.lire.c2')}</li>
      <li><strong>${c.t('radar.lire.c3t')}</strong> ${c.t('radar.lire.c3')}</li>
    </ol>
  </div>
</section>

<section class="faq-radar conteneur" id="faq">
  <svg class="faq-ondes" viewBox="0 0 200 200" aria-hidden="true" data-fx="trace">${brut([30, 55, 80].map((r2) => `<circle cx="100" cy="100" r="${r2}" fill="none" stroke="currentColor" stroke-width="2"/>`).join(''))}<path d="M100 100 L170 40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
  <div>
    <p class="surtitre">${c.t('radar.faq.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('radar.faq.titre')}</h2>
    ${['q1', 'q2', 'q3', 'q4'].map((q) => html`<details class="faq-item" data-anime><summary>${c.t('radar.faq.' + q)}</summary><p>${c.t('radar.faq.' + q + 'r')}</p></details>`)}
    <p class="actions">${c.lien('commune', { ancre: 'recherche', classe: 'bouton bouton--soleil', texte: c.t('accueil.sources.bouton'), attrs: 'data-survol="magnetique"' })}</p>
  </div>
</section>
`;
};
