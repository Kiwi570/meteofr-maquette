# MétéoFR · maquette v1 « Ciel vivant »

Maquette du site de MétéoFR (site actuel : meteofr.lovable.app), adresse prévue : https://meteofr-maquette.vercel.app.
Site statique (HTML, CSS, JavaScript), généré depuis `donnees/` et `source/`, prêt pour Vercel sans étape de construction.

## Pages

| Page | Ouverture | Effets propres |
|---|---|---|
| Accueil `/` | Intro « jour-qui-se-lève » (l'heure défile jusqu'à l'heure réelle, le ciel suit), puis ciel vivant | ciel-vivant, girouette, jauges, courbe-24h, vague-vigilance, radar-defile, thermo-rail, mini-ciels, telephone, isobares |
| Ma commune `/commune?nom=…&lat=…&lon=…&dep=…` | « vitre » : le ciel réel vu par la fenêtre, pluie WebGL et buée à essuyer | vitre, rose-des-vents, arc-solaire, zoom-departement, thermo-rail |
| Radar & carte `/radar` | « balayage » : un faisceau révèle les images radar | balayage, calques |
| Vigilance `/vigilance` (`?jour=demain`) | « nuancier » : trois bandes qui se remplissent jusqu'au niveau du jour | nuancier, crue-voile, vague-vigilance |
| Application `/application` | « émergence » : le téléphone monte à travers la mer de nuages | emergence |
| Contact `/contact` (`?sujet=erreur`) | « ballon-sonde » : formulaire simulé, le ballon s'envole à l'envoi | ballon-sonde |
| 404 | « brouillard » qui se dissipe sous le doigt | brouillard |

Sur tout le site : voile de transition « front » (front froid des cartes météo), mode calme (« Réduire les animations », pied de page et menu).

## Données

- **En direct** : Open-Meteo (prévisions, géocodage des communes), appelé depuis le navigateur, sans clé. Licence CC BY 4.0 : la mention « Open-Meteo » est obligatoire (pied de page et section Sources).
- **Radar** : RainViewer (images des deux dernières heures, niveau de zoom 5, posées sur la carte des départements dans la même projection).
- **Relevé figé** (`donnees/releve.json`) : relevé réel Open-Meteo du 5 novembre 2026, 15 h 30, pour Paris et 20 villes. Affiché sans JavaScript ou si le réseau ne répond pas, avec sa date.
- **Vigilance** (`donnees/vigilance.json`) : **démonstration figée**, relevée sur le site actuel le 5 novembre 2026 à 15 h 20 (source Météo-France). La maquette ne la met pas à jour ; un message le signale quand la date est passée. Sur le site final : brancher la source officielle (API Vigilance de Météo-France, avec clé) et garder la mention de la source et le lien vers vigilance.meteofrance.fr.
- **Contours des départements** : IGN ADMIN EXPRESS via france-geojson (Licence Ouverte), simplifiés dans `donnees/france.json`.
- **Favoris** : enregistrés dans le navigateur seulement (`localStorage`) ; le site actuel les relie à un compte.

## Mise à jour

```
node outils/generer.mjs
node outils/images-partage.mjs
node _audit/audit.mjs
```
Ne jamais modifier les pages `.html` à la main : elles sont réécrites par le générateur. Changer `version` dans `donnees/site.json` à chaque livraison.

## À fournir par MétéoFR (à compléter)

- Mentions légales : éditeur (raison sociale ou nom, adresse, SIRET ou équivalent), directeur de la publication.
- Hébergeur : Vercel Inc. (adresse à vérifier sur le site de Vercel au moment de la mise en ligne).
- Politique de confidentialité (RGPD) : données du formulaire de contact, comptes et favoris, mesure d'audience du site actuel.
- Coordonnées de contact (e-mail, adresse éventuelle).
- Application : version, taille et empreinte du fichier APK ; disponibilité sur iPhone ; gratuité ; raison du fichier APK hors magasin d'applications.
- Lien de téléchargement de l'APK : à brancher sur le bouton « Installer l'appli Android » (page Application, section « installer » ; aucun lien vers le site actuel dans la maquette).
- Confirmation de la mention « Service indépendant, non affilié à Météo-France ».
- Logo : deux versions coexistent sur le site actuel (icône nuage-soleil-pluie sur dégradé bleu, et soleil orange dans l'en-tête) ; la maquette retient l'icône d'appli, redessinée en SVG.
- Crédits des illustrations générées : toutes les photos de la maquette sont des images créées par IA (Grok) et portent la mention « Illustration générée », à garder sur le site final.

## Incohérences relevées sur le site actuel

- « Actualisé chaque minute » en haut, « mises à jour plusieurs fois par jour » en pied de page.
- Aucune source ni crédit affiché (Open-Meteo et OpenStreetMap l'exigent).
- Badge « Edit with Lovable » visible.

## À retirer à la mise en ligne définitive

- `noindex` : balise robots dans `source/gabarits/commun.mjs` et en-tête X-Robots-Tag dans `vercel.json`.
- Données de démonstration : vigilance figée (`donnees/vigilance.json`), mentions « à compléter ».
- Formulaire simulé (contact) : le brancher sur un vrai envoi.

## À garder

- La mention « Illustration générée » sur chaque image créée par IA.
- Les crédits des données (Open-Meteo, Météo-France, RainViewer, IGN).

## Bibliothèque

Mécaniques reprises de la bibliothèque des maquettes : `pluie-sur-vitre` (shader repris tel quel, dans `assets/js/vitre.js`), `ciel-en-direct` (calcul de la hauteur du soleil), `courbe-interactive`, `semainier`, `telephone-epingle`, `carte-a-calques`, `manifeste-mot-a-mot` (adaptés), `galerie-horizontale-epinglee` et effets du socle.
