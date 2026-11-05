/* Image de partage 1200×630 de chaque page (photo du client, logo, accroche, polices et couleurs du site).
   outils/images-partage.mjs photographie ces pages et écrit assets/partage/<page>-<langue>.jpg. */
import { html, brut } from '../../outils/gabarit.mjs';

export function page(c) {
  const cle = c.page.cle;
  const image = c.page.imagePartage || c.site.imagePartage;
  return html`<!doctype html>
<html lang="${c.l}"><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/css/socle.css"><link rel="stylesheet" href="/assets/css/site.css">
<style>${brut(`:root{--fond:${c.site.couleurs.fond};--texte:${c.site.couleurs.texte}}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:var(--fond);color:var(--texte)}
.carte{display:grid;grid-template-columns:1fr 1fr;width:1200px;height:630px}
.carte-texte{display:flex;flex-direction:column;justify-content:space-between;padding:64px}
.carte-texte img{width:72px;height:72px}
.carte-titre{font-family:var(--police-titres);font-weight:600;font-size:62px;line-height:1.02;letter-spacing:-.02em;margin:0;text-wrap:balance;color:#0d2f6d}
.carte-nom{font-size:24px;font-weight:600;margin:0}
.carte-image{position:relative;background:center/cover no-repeat}.carte-image span{position:absolute;right:14px;bottom:14px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.66);color:#fff;font:600 15px system-ui,sans-serif}.carte-texte img{border-radius:16px}`)}</style>
</head><body>
<div class="carte">
  <div class="carte-texte">
    <img src="/assets/images/logo.svg" alt="">
    <p class="carte-titre">${c.t(`pages.${cle}.accroche`)}</p>
    <p class="carte-nom">${c.site.nom}</p>
  </div>
  <div class="carte-image" style="background-image:url('/assets/images/${image}')">${image.startsWith('grok/') ? html`<span>${c.t('commun.mentionIa')}</span>` : ''}</div>
</div>
</body></html>`;
}
