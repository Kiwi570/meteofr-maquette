/* Parcours propres à MétéoFR : filtres des 16 jours, bascule aujourd'hui / demain de la vigilance,
   moments de la carte des prévisions, radar (lecture et curseur), favoris locaux, donnée abîmée. */
export default async function ({ contexte, attendrePret, attendre, BASE, R, T }) {
  const { ctx, page } = await contexte({ taille: T('1366×768') });
  try {
    /* Filtre « jours de pluie » : les jours de pluie passent devant, les autres s'estompent. */
    await page.goto(BASE + '/', { waitUntil: 'load' }); await attendrePret(page);
    await page.locator('[data-filtre="oui"]').scrollIntoViewIfNeeded(); await page.click('[data-filtre="oui"]'); await attendre(900);
    const f = await page.evaluate(() => { const li = [...document.querySelectorAll('[data-semainier] > li')]; const n = li.filter((x) => x.dataset.pluie === 'oui').length; return { ok: li.slice(0, n).every((x) => x.dataset.pluie === 'oui') && li.slice(n).every((x) => x.classList.contains('estompe')), n, total: li.length }; });
    if (!f.ok) R.echec('filtre-jours', `ordre ou estompage incorrect (${f.n} jours de pluie sur ${f.total})`, { page: '/', taille: '1366×768' });
    /* Vigilance : demain affiche la liste de demain, et le lien profond ?jour=demain aussi. */
    await page.goto(BASE + '/vigilance?jour=demain', { waitUntil: 'load' }); await attendrePret(page);
    const v = await page.evaluate(() => ({ demain: !document.querySelector('[data-vig-liste="demain"]').hidden, pressé: document.querySelector('[data-jour="demain"]').getAttribute('aria-pressed') }));
    if (!v.demain || v.pressé !== 'true') R.echec('vigilance-demain', 'le lien ?jour=demain n’affiche pas la vigilance de demain', { page: '/vigilance' });
    /* Carte des prévisions : le moment « Matin » change l'état affiché. */
    await page.goto(BASE + '/radar', { waitUntil: 'load' }); await attendrePret(page);
    await page.locator('[data-moment="matin"]').scrollIntoViewIfNeeded(); await page.click('[data-moment="matin"]'); await attendre(400);
    const m = await page.textContent('[data-calques-etat]');
    if (!/Matin/.test(m)) R.echec('calques', `état « ${m} » après le choix du matin`, { page: '/radar' });
    /* Favoris : ajout puis retrait, liste à jour. */
    await page.goto(BASE + '/commune', { waitUntil: 'load' }); await attendrePret(page);
    await page.click('[data-favori]'); await attendre(200);
    const fav = await page.evaluate(() => document.querySelectorAll('[data-favoris] li').length);
    await page.click('[data-favori]'); await attendre(200);
    const fav2 = await page.evaluate(() => document.querySelectorAll('[data-favoris] li').length);
    if (fav !== 1 || fav2 !== 0) R.echec('favoris', `liste ${fav} puis ${fav2} au lieu de 1 puis 0`, { page: '/commune' });
    /* Donnée abîmée : le site démarre quand même. */
    await page.evaluate(() => { localStorage.setItem('meteofr:lieu', '{abîmé'); localStorage.setItem('meteofr:favoris', 'x'); });
    await page.reload({ waitUntil: 'load' });
    if ((await attendrePret(page)) === 'jamais-pret') R.echec('donnees-abimees', 'une donnée abîmée bloque la fiche commune', { page: '/commune' });
  } finally { await ctx.close(); }
}
