/* Gabarit commun : head, en-tête, menu, pied de page, barre fixe du téléphone, voile « front », intro.
   Les conventions data-* sont celles que lisent le socle JavaScript et l'audit (voir le README). */
import { html, brut } from '../../outils/gabarit.mjs';
import { sprite, icone } from './icones.mjs';

const navigation = (c) => c.site.navigation.filter((cle) => c.pages[cle] && (c.pages[cle].langues || c.langues).includes(c.l));

function tete(c) {
  const p = c.page, cle = p.cle;
  const titre = c.s(`pages.${cle}.titre`), description = c.s(`pages.${cle}.description`);
  const ici = c.abs(c.url(cle));
  const imagePartage = c.abs(`/assets/partage/${p.partage === false ? 'accueil' : cle}-${c.l}.jpg`);
  const structure = c.donnees.structure ? JSON.stringify(c.donnees.structure).replace(/</g, '\\u003c') : '';
  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${titre}</title>
<meta name="description" content="${description}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${ici}">
<style>${brut(c.critique.css)}</style>
<script>${brut(c.critique.js)}</script>
${(c.site.polices || []).map((f) => html`<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>\n`)}<link rel="stylesheet" href="${c.asset('css/socle.css')}">
<link rel="stylesheet" href="${c.asset('css/site.css')}">
<link rel="modulepreload" href="${c.asset('js/site.js')}">
<link rel="modulepreload" href="${c.asset('js/socle/index.js')}">
<link rel="preconnect" href="https://api.open-meteo.com" crossorigin>
<script src="/assets/vendor/gsap.min.js" defer></script>
<script src="/assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="/assets/vendor/SplitText.min.js" defer></script>
${p.flip ? html`<script src="/assets/vendor/Flip.min.js" defer></script>` : ''}
<script type="module" src="${c.asset('js/site.js')}"></script>
<meta name="theme-color" content="${c.site.couleurs.theme || c.site.couleurs.fond}">
<link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${c.site.nom}">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${titre}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${ici}">
<meta property="og:image" content="${imagePartage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${c.s(`pages.${p.partage === false ? 'accueil' : cle}.partageAlt`)}">
<meta name="twitter:card" content="summary_large_image">
${structure ? html`<script type="application/ld+json">${brut(structure)}</script>` : ''}
</head>`;
}

function marque(c) {
  return html`<a class="entete-logo" href="${c.url('accueil')}" data-libelle="${c.libelle('accueil')}"${c.page.cle === 'accueil' ? brut(' aria-current="page"') : ''}>
      <img src="/assets/images/logo.svg" alt="" width="36" height="36"><span>${c.site.nom}</span>
    </a>`;
}

function entete(c) {
  return html`<header data-entete>
  <div class="entete-rangee">
    ${marque(c)}
    <nav data-nav aria-label="${c.s('commun.navigation')}">
      <ul>${navigation(c).filter((k) => k !== 'accueil').map((k) => html`<li>${c.lien(k)}</li>`)}</ul>
    </nav>
    <div class="entete-actions">
      <a class="bouton bouton--soleil" href="${c.url(c.site.actionEntete.page, c.site.actionEntete.ancre || '')}" data-libelle="${c.libelle(c.site.actionEntete.page)}">${icone('telecharger')}${c.t('commun.actionEntete')}</a>
      <button type="button" data-menu-bouton aria-controls="menu" aria-expanded="false" data-libelle-ouvrir="${c.s('commun.menu')}" data-libelle-fermer="${c.s('commun.fermer')}"><span data-libelle-bouton>${c.t('commun.menu')}</span></button>
    </div>
  </div>
</header>
<div id="menu" data-menu role="dialog" aria-modal="true" aria-label="${c.s('commun.menu')}">
  <ul>${navigation(c).map((k, i) => html`<li style="--i:${i}">${c.lien(k, { classe: 'menu-lien' })}</li>`)}</ul>
  <p>${c.lien('commune', { ancre: 'recherche', classe: 'bouton', texte: html`${icone('loupe')}${c.t('commun.chercher')}` })}</p>
  <p><button type="button" class="lien" data-calme-bascule data-libelle-reduire="${c.s('commun.calmeReduire')}" data-libelle-retablir="${c.s('commun.calmeRetablir')}" data-libelle-systeme="${c.s('commun.calmeSysteme')}"><span data-libelle-bouton>${c.t('commun.calmeReduire')}</span></button></p>
</div>`;
}

function pied(c) {
  return html`<footer class="pied" id="pied">
  <div class="conteneur pied-grille">
    <div class="pied-marque">
      <p class="pied-logo"><img src="/assets/images/logo.svg" alt="" width="40" height="40"><strong>${c.site.nom}</strong></p>
      <p>${c.t('commun.devise')}</p>
      <p class="pied-independant">${c.t('commun.independant')}</p>
    </div>
    <nav aria-label="${c.s('commun.sommaire')}">
      <p><strong>${c.t('commun.sommaire')}</strong></p>
      <ul>${navigation(c).map((k) => html`<li>${c.lien(k)}</li>`)}</ul>
    </nav>
    <div>
      <p><strong>${c.t('commun.sources')}</strong></p>
      <ul class="pied-sources">
        <li>${c.t('commun.sourceOpenMeteo')}</li>
        <li>${c.t('commun.sourceVigilance')}</li>
        <li>${c.t('commun.sourceRadar')}</li>
        <li>${c.t('commun.sourceCarte')}</li>
      </ul>
    </div>
    <div>
      <p><strong>${c.t('commun.confort')}</strong></p>
      <ul>
        <li><button type="button" class="lien" data-calme-bascule data-libelle-reduire="${c.s('commun.calmeReduire')}" data-libelle-retablir="${c.s('commun.calmeRetablir')}" data-libelle-systeme="${c.s('commun.calmeSysteme')}"><span data-libelle-bouton>${c.t('commun.calmeReduire')}</span></button></li>
        <li><a href="#haut" data-sans-transition>${c.t('commun.retourHaut')}</a></li>
      </ul>
    </div>
  </div>
  <div class="conteneur pied-bas">
    <p>${c.t('commun.maquette')}</p>
    <p>${c.t('commun.mentions')} · ${c.t('commun.confidentialite')} · © ${c.site.nom}</p>
  </div>
</footer>`;
}

function barre(c) {
  return html`<div data-barre-fixe>
  ${c.lien('commune', { ancre: 'recherche', classe: 'bouton bouton--contour', texte: html`${icone('loupe')}${c.t('commun.barreCommune')}` })}
  ${c.lien('radar', { classe: 'bouton', texte: html`${icone('pluie')}${c.t('commun.barreRadar')}` })}
</div>`;
}

/* Voile « front » : un front de nuages mène le voile, en haut à l'aller, en bas au retour. */
function voile(c) {
  const front = (sens) => {
    const R = [46, 34, 58, 40, 64, 36, 52, 44, 60, 38, 56, 42, 62, 48, 36, 54, 40, 58];
    const bulles = (dy, coul, k) => R.map((r, i) => { const x = i * 70 + (k ? 35 : 0), rr = r * (k ? 0.8 : 1); const cy = sens === 'haut' ? 90 - rr * 0.42 + dy : rr * 0.42 - dy; return `<circle cx="${x}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}" fill="${coul}"/>`; }).join('');
    return brut(`<svg class="front front--${sens}" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true">${bulles(-14, '#3f6fae', true)}${bulles(0, '#0d2f6d', false)}</svg>`);
  };
  return html`<div data-voile data-effet="front" aria-hidden="true">${front('haut')}${front('bas')}<div class="voile-contenu"><img src="/assets/images/logo-clair.svg" alt="" width="56" height="56"><span data-voile-libelle>${c.libelle(c.page.cle)}</span></div></div>`;
}

/* Intro « jour-qui-se-lève » : soleil qui se trace, heure qui défile jusqu'à l'heure réelle, ciel de la journée. */
function intro(c) {
  return html`<div class="ouverture-panneau" data-ouverture data-effet="jour-qui-se-leve" aria-hidden="true">
  <div class="intro-ciel"></div>
  <div class="intro-centre">
    <svg class="intro-soleil" viewBox="0 0 120 120" aria-hidden="true"><circle class="intro-disque" cx="60" cy="60" r="20"/><g class="intro-rayons"><path d="M60 14v14M60 92v14M14 60h14M92 60h14M27.5 27.5l9.9 9.9M82.6 82.6l9.9 9.9M27.5 92.5l9.9-9.9M82.6 37.4l9.9-9.9"/></g></svg>
    <p class="intro-heure" data-intro-heure>00:00</p>
    <p class="intro-ligne">${c.site.nom} · ${c.t('commun.devise')}</p>
  </div>
</div>`;
}

/* Données de la page pour le JavaScript : une seule source (donnees/), écrite dans la page. */
function donneesPage(c) {
  const d = { codes: c.donnees.codes, releve: c.donnees.releve, vigilance: c.donnees.vigilance, textes: c.donnees.textesjs || {} };
  return brut(`<script type="application/json" id="donnees-meteo">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`);
}

export function page(c, contenu) {
  return html`<!doctype html>
<html lang="${c.l}" data-v="${c.v}" data-page="${c.page.cle}">
${tete(c)}
<body id="haut">
${sprite()}
${voile(c)}
${intro(c)}
<a class="evitement" href="#contenu">${c.t('commun.evitement')}</a>
${entete(c)}
<nav class="altimetre" data-altimetre aria-label="${c.s('commun.reperes')}" hidden></nav>
<main id="contenu" tabindex="-1"${c.page.sansAction ? brut(' data-sans-action') : ''}${c.page.sansEffet ? brut(' data-sans-effet') : ''}>
${contenu}
</main>
${pied(c)}
${barre(c)}
${donneesPage(c)}
</body>
</html>`;
}
