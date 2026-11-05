/* Contact : ouverture compacte « ballon-sonde » : le formulaire d'abord ; à l'envoi simulé, un ballon s'envole. */
import { html, brut } from '../../outils/gabarit.mjs';

export const page = { cle: 'contact', fichier: 'contact', imagePartage: 'grok/ballon-sonde-1168.webp' };

export default (c) => html`
<section class="contact-page" id="debut">
  <div class="conteneur contact-grille">
    <div class="contact-texte">
      <p class="surtitre">${c.t('contact.surtitre')}</p>
      <h1 class="contact-titre" data-anime="gsap">${c.t('contact.titre')}</h1>
      <p data-anime="gsap">${c.t('contact.texte')}</p>
      <p class="actions" data-anime="gsap"><a class="bouton" href="#message" data-action-principale>${c.t('contact.ecrire')}</a> ${c.lien('contact', { params: 'sujet=erreur', ancre: 'message', classe: 'bouton bouton--contour', texte: c.t('contact.sujets.erreur') })}</p>
      <form class="formulaire formulaire--etapes" data-formulaire data-anime="gsap" novalidate>
        <div class="ballon-rail" data-ballon-rail data-effet="ballon-qui-monte" aria-hidden="true"><span class="br-fil"></span><span class="br-pion" data-ballon-pion><svg viewBox="0 0 40 90"><ellipse cx="20" cy="18" rx="16" ry="18" fill="#fff" stroke="#0d2f6d" stroke-width="2.5"/><path d="M20 36 V78" stroke="#0d2f6d" stroke-width="2"/><rect x="15" y="78" width="10" height="9" rx="2" fill="#fff" stroke="#0d2f6d" stroke-width="2.5"/></svg><span class="br-alt" data-ballon-alt>0 m</span></span></div>
        <fieldset class="sujets form-etape" data-etape-form>
          <legend><span class="form-num">1</span>${c.t('contact.sujet')}</legend>
          ${['question', 'erreur', 'presse', 'partenariat'].map((s, i) => html`<label class="sujet"><input type="radio" name="sujet" value="${s}"${i === 0 ? brut(' checked') : ''}><span>${c.t('contact.sujets.' + s)}</span></label>`)}
        </fieldset>
        <div class="form-etape" data-etape-form>
          <p class="form-titre"><span class="form-num" aria-hidden="true">2</span>${c.t('contact.etape2')}</p>
          <div class="champs-deux">
            <div class="champ"><label for="nom">${c.t('contact.nom')}</label><input id="nom" name="nom" autocomplete="name" required></div>
            <div class="champ"><label for="email">${c.t('contact.email')}</label><input id="email" name="email" type="email" autocomplete="email" required></div>
          </div>
          <div class="champ"><label for="commune-contact">${c.t('contact.commune')}</label><input id="commune-contact" name="commune" autocomplete="address-level2"></div>
        </div>
        <div class="form-etape" data-etape-form>
          <p class="form-titre"><span class="form-num" aria-hidden="true">3</span>${c.t('contact.etape3')}</p>
          <div class="champ"><label for="message">${c.t('contact.message')}</label><textarea id="message" name="message" rows="5" required></textarea></div>
        </div>
        <p class="mention-donnees">${c.t('contact.donnees')}</p>
        <p><button class="bouton bouton--soleil" type="submit">${c.t('contact.envoyer')}</button></p>
        <p data-message-envoi hidden tabindex="-1" data-texte="${c.s('contact.envoye')}"></p>
        <span class="ballon-volant" data-ballon aria-hidden="true"><svg viewBox="0 0 40 90"><ellipse cx="20" cy="18" rx="16" ry="18" fill="#fff" stroke="#0d2f6d" stroke-width="2"/><path d="M20 36 V78" stroke="#0d2f6d" stroke-width="1.5"/><rect x="15" y="78" width="10" height="9" rx="2" fill="#fff" stroke="#0d2f6d" stroke-width="2"/></svg></span>
      </form>
    </div>
    <div class="contact-ciel" data-contact-ciel data-effet="ballon-sonde">
      ${c.media({ nom: 'grok/ballon-sonde', alt: c.s('contact.alt'), cadrage: '72% 35%', priorite: true, classe: 'contact-photo', sizes: '(max-width: 860px) 100vw, 44vw' })}
    </div>
  </div>
</section>

<section class="coordonnees conteneur" id="coordonnees">
  <svg class="trajectoire" viewBox="0 0 400 220" aria-hidden="true" data-fx="trace"><path d="M10 210 C 80 200, 120 150, 170 120 S 260 60, 300 40 S 370 20, 390 10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="1 0"/><circle cx="390" cy="10" r="7" fill="currentColor"/></svg>
  <div>
    <p class="surtitre">${c.t('contact.coord.surtitre')}</p>
    <h2 data-anime="lignes">${c.t('contact.coord.titre')}</h2>
    <ul class="coord-liste" data-anime="cascade">
      <li><strong>${c.t('contact.coord.email')}</strong><span>${c.site.contact.email}</span></li>
      <li><strong>${c.t('contact.coord.adresse')}</strong><span>${c.site.contact.adresse}</span></li>
      <li><strong>${c.t('contact.coord.erreurT')}</strong><span>${c.t('contact.coord.erreur')}</span></li>
    </ul>
    <p class="actions">${c.lien('commune', { ancre: 'recherche', classe: 'bouton', texte: c.t('accueil.sources.bouton'), attrs: 'data-survol="magnetique"' })}</p>
  </div>
</section>
`;
