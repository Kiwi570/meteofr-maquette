/* Application : ouverture « émergence » (le téléphone, écran en vraies données, monte à travers la mer de nuages),
   fonctions, installation de l'APK pas à pas, questions. */
import { html, brut } from '../../outils/gabarit.mjs';
import { icone } from '../gabarits/icones.mjs';
import { deg, releve, libelle, ico, etatCiel, carteFrance, teinte, niveauMax } from '../gabarits/meteo.mjs';

export const page = { cle: 'application', fichier: 'application', imagePartage: 'grok/mer-de-nuages-1168.webp' };


export default (c) => {
  const r = releve(c);
  const m = r.maintenant;
  return html`
<section class="emergence" id="debut" data-emergence>
  ${c.media({ nom: 'grok/mer-de-nuages', alt: '', cadrage: '50% 62%', priorite: true, classe: 'emergence-fond', sizes: '100vw' })}
  <div class="conteneur emergence-contenu">
    <p class="surtitre surtitre--clair" data-anime="gsap">${c.t('application.surtitre')}</p>
    <h1 class="emergence-titre" data-anime="gsap">${c.t('application.titre')}</h1>
    <p class="emergence-texte" data-anime="gsap">${c.t('application.texte')}</p>
    <p class="actions emergence-actions" data-anime="gsap">${c.lien('application', { ancre: 'installer', classe: 'bouton bouton--soleil', texte: html`${icone('telecharger')}${c.t('application.bouton')}`, attrs: 'data-action-principale' })} ${c.lien('application', { ancre: 'fonctions', classe: 'bouton bouton--sombre', texte: c.t('application.comment') })}</p>
    <p class="emergence-info" data-info-cle data-anime="gsap">${c.t('application.info')}</p>
  </div>
  <div class="emergence-scene" data-effet="emergence" aria-hidden="true">
    <div class="telephone telephone--emergence" data-telephone-emergence>
      <div class="telephone-ecran" data-ecran-etat="${etatCiel(c, m.code, m.jour)}">
        <div class="ecran-app est-active"><p class="ea-lieu">${r.lieu.nom}</p><p class="ea-temp" data-m="t">${deg(m.t)}</p><p class="ea-lib">${ico(c, m.code, m.jour)} <span data-m="libelle">${libelle(c, m.code)}</span></p></div>
      </div>
    </div>
    <div class="emergence-nuage emergence-nuage--g"></div><div class="emergence-nuage emergence-nuage--d"></div>
    <div class="emergence-brume"></div>
  </div>
</section>

<section class="fonctions" id="fonctions" data-fonctions>
  <div class="conteneur fonctions-grille2">
    <div>
      <div class="tete-section">
        <p class="surtitre">${c.t('application.fonctions.surtitre')}</p>
        <h2 data-anime="lignes">${c.t('application.fonctions.titre')}</h2>
      </div>
      <ol class="fonctions-liste" data-effet="telephone-fonctions">
        ${[['loupe', 'f1'], ['soleil', 'f2'], ['pluie', 'f3'], ['alerte', 'f4'], ['etoile', 'f5'], ['vent', 'f6']].map(([ic, k], i) => html`<li class="fonction" data-fonction="${i}"><span class="fonction-ico">${icone(ic)}</span><div><h3>${c.t('application.fonctions.' + k + 't')}</h3><p>${c.t('application.fonctions.' + k)}</p></div></li>`)}
      </ol>
    </div>
    <div class="telephone-colonne" aria-hidden="true">
      <div class="telephone telephone--fonctions">
        <div class="telephone-ecran" data-ecran-etat="${etatCiel(c, m.code, m.jour)}">
          <div class="ecran-app est-active" data-ecran-f="0"><p class="ea-titre">${c.site.nom}</p><p class="ea-champ">${icone('loupe')} <span data-tape="Lyon">Lyon</span></p><ul class="ea-sugg"><li>Lyon (69)</li><li>Lyons-la-Forêt (27)</li><li>Lyoffans (70)</li></ul></div>
          <div class="ecran-app" data-ecran-f="1"><p class="ea-lieu">${r.lieu.nom}</p><p class="ea-temp">${deg(m.t)}</p><p class="ea-lib">${ico(c, m.code, m.jour)} <span>${libelle(c, m.code)}</span></p><p class="ea-texte">${c.t('composants.ressenti')} ${deg(m.ressenti)} · ${c.t('composants.jauge.rafales')} ${m.rafales} km/h</p></div>
          <div class="ecran-app ecran-app--radar" data-ecran-f="2">${carteFrance(c, { classe: 'france--mini', aria: '' })}<span class="ea-pluie"></span><span class="ea-pluie ea-pluie--2"></span><p class="ea-legende">${c.t('accueil.appli.ecranRadar')}</p></div>
          <div class="ecran-app" data-ecran-f="3"><p class="ea-alerte vig-niveau--${niveauMax(c)}">${icone('alerte')} ${c.t('vigilance.bandeau.' + niveauMax(c))}</p><p class="ea-texte">${c.t('accueil.appli.ecranAlerte')}</p></div>
          <div class="ecran-app" data-ecran-f="4"><p class="ea-titre">${c.t('application.fonctions.f5t')}</p><ul class="ea-favoris">${['Paris', 'Lyon', 'Marseille'].map((n) => { const v = r.villes.find((x) => x.nom === n); return html`<li>${icone('etoile')}<span>${n}</span><b>${deg(v.t)}</b></li>`; })}</ul></div>
          <div class="ecran-app" data-ecran-f="5"><p class="ea-titre">${c.t('application.fonctions.f6t')}</p><ol class="ea-bandes">${r.jours.map((j) => html`<li style="--teinte:${brut(teinte((j.tmin + j.tmax) / 2))}"></li>`)}</ol><p class="ea-texte">${deg(Math.min(...r.jours.map((j) => j.tmin)))} → ${deg(Math.max(...r.jours.map((j) => j.tmax)))}</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="installer" id="installer" data-installer>
  <div class="conteneur installer-grille">
    <div>
      <p class="surtitre">${c.t('application.installer.surtitre')}</p>
      <h2 data-anime="lignes">${c.t('application.installer.titre')}</h2>
      <ol class="etapes-install" data-effet="etapes-install">
        <svg class="etapes-fil" viewBox="0 0 4 400" preserveAspectRatio="none" aria-hidden="true" data-fx="trace">${brut('<path d="M2 0 V400" stroke="currentColor" stroke-width="4" fill="none" vector-effect="non-scaling-stroke"/>')}</svg>
        ${['e1', 'e2', 'e3', 'e4'].map((k, i) => html`<li data-anime><span class="etape-pastille">${i + 1}</span><div><h3>${c.t('application.installer.' + k + 't')}</h3><p>${c.t('application.installer.' + k)}</p></div></li>`)}
      </ol>
      <p class="note-demo">${c.t('application.installer.note')}</p>
      <p class="apk-brancher">${icone('telecharger')}<span>${c.t('application.apk')}</span></p>
    </div>
    <div class="installer-visuel" data-effet="installation-en-direct">
      ${c.media({ nom: 'grok/telephone-table', alt: c.s('application.installer.alt'), cadrage: '60% 60%', classe: 'installer-photo', sizes: '(max-width: 860px) 100vw, 42vw' })}
      <div class="install-etat" aria-hidden="true"><span data-install-texte>${c.t('application.installer.pret')}</span><i><b data-install-barre></b></i></div>
    </div>
  </div>
</section>

<section class="faq-appli conteneur" id="faq">
  <svg class="faq-ondes" viewBox="0 0 200 200" aria-hidden="true" data-fx="trace">${brut('<rect x="62" y="20" width="76" height="160" rx="16" fill="none" stroke="currentColor" stroke-width="3"/><path d="M88 34h24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M80 120c10-30 30-30 40 0" fill="none" stroke="currentColor" stroke-width="3"/>')}</svg>
  <div>
    <p class="surtitre">${c.t('application.faq.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('application.faq.titre')}</h2>
    ${['q1', 'q2', 'q3', 'q4'].map((q) => html`<details class="faq-item" data-anime><summary>${c.t('application.faq.' + q)}</summary><p>${c.t('application.faq.' + q + 'r')}</p></details>`)}
    <p class="actions">${c.lien('contact', { classe: 'bouton', texte: c.t('application.faq.contact'), attrs: 'data-survol="magnetique"' })}</p>
  </div>
</section>
`;
};
