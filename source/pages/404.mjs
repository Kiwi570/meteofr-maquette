/* 404 « brouillard » : la page se perd dans la brume, qui se dissipe sous le doigt. */
import { html } from '../../outils/gabarit.mjs';
import { recherche } from './accueil.mjs';

export const page = { cle: '404', fichier: '404', langues: ['fr'], partage: false };

export default (c) => html`
<section class="introuvable" id="debut" data-brouillard>
  ${c.media({ nom: 'grok/ciel-brouillard', alt: c.s('pages.404.partageAlt'), cadrage: '60% 60%', priorite: true, classe: 'introuvable-photo', sizes: '100vw' })}
  <canvas class="introuvable-brume" data-brume data-effet="brouillard" aria-hidden="true"></canvas>
  <div class="conteneur introuvable-contenu">
    <p class="surtitre">404</p>
    <h1 data-anime="lignes">${c.t('introuvable.titre')}</h1>
    <p data-anime>${c.t('introuvable.texte')}</p>
    <p data-anime>${c.lien('accueil', { classe: 'bouton bouton--soleil', texte: c.t('introuvable.retour'), attrs: 'data-action-principale' })}</p>
    <div data-anime>${recherche(c, { id: 'recherche-404', compact: true, principal: false })}</div>
  </div>
</section>
`;
