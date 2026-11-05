# Rapport d’audit

Projet : `meteofr-maquette` · 05/11/2026 19:49:05 · 7 min · 7 page(s) · audit standard (étapes : fichiers, mesures, films, ecran)

## Résumé

- Échecs : **0**
- À regarder : **19**
- Non lancé : **1**
- Contrôles passés : vercel.json (1), .vercelignore (1), robots.txt (1), numéro de version (1), langues (1), mesures (77), balayage (6), films d’ouverture (12), films de transition (12), tient dans l’écran (8)

## Échecs

Aucun.

## À regarder

### ouverture : changement brusque (15)

- **ouverture : changement brusque** — `/` — à 968 ms (différence 37 %) (films/ouverture-1366.png) _(1366×768 film)_
- **ouverture : changement brusque** — `/application` — à 752 ms (différence 25 %) (films/ouverture-application-1366.png) _(1366×768 film)_
- **ouverture : changement brusque** — `/commune` — à 923 ms (différence 24 %) (films/ouverture-commune-1366.png) _(1366×768 film)_
- **ouverture : changement brusque** — `/contact` — à 854 ms (différence 26 %) (films/ouverture-contact-1366.png) _(1366×768 film)_
- **ouverture : changement brusque** — `/radar` — à 812 ms (différence 27 %) (films/ouverture-radar-1366.png) _(1366×768 film)_
- **ouverture : changement brusque** — `/vigilance` — à 678 ms (différence 36 %) (films/ouverture-vigilance-1366.png) _(1366×768 film)_
- **ouverture : changement brusque** — `/vigilance` — à 872 ms (différence 25 %) (films/ouverture-vigilance-1366.png) _(1366×768 film)_
- **ouverture : changement brusque** — `/` — à 917 ms (différence 22 %) (films/ouverture-390.png) _(390×844 film)_
- **ouverture : changement brusque** — `/application` — à 783 ms (différence 21 %) (films/ouverture-application-390.png) _(390×844 film)_
- **ouverture : changement brusque** — `/application` — à 800 ms (différence 21 %) (films/ouverture-application-390.png) _(390×844 film)_
- **ouverture : changement brusque** — `/commune` — à 900 ms (différence 28 %) (films/ouverture-commune-390.png) _(390×844 film)_
- **ouverture : changement brusque** — `/contact` — à 853 ms (différence 24 %) (films/ouverture-contact-390.png) _(390×844 film)_
- **ouverture : changement brusque** — `/radar` — à 914 ms (différence 23 %) (films/ouverture-radar-390.png) _(390×844 film)_
- **ouverture : changement brusque** — `/vigilance` — à 667 ms (différence 25 %) (films/ouverture-vigilance-390.png) _(390×844 film)_
- **ouverture : changement brusque** — `/vigilance` — à 682 ms (différence 21 %) (films/ouverture-vigilance-390.png) _(390×844 film)_

### retour avant : changement brusque (2)

- **retour avant : changement brusque** — `/commune` — à 83 ms (différence 50 %) (films/retour-avant-1366.png) _(1366×768 retour avant)_
- **retour avant : changement brusque** — `/commune` — à 67 ms (différence 47 %) (films/retour-avant-390.png) _(390×844 retour avant)_

### au retour avant, élément qui réapparaît en s’animant (1)

- **au retour avant, élément qui réapparaît en s’animant** — `/commune` — figure.vitre > div.pluie > canvas.pluie__canvas _(1366×768 retour avant, 390×844 retour avant)_

### retour arrière : changement brusque (1)

- **retour arrière : changement brusque** — `/` — à 89 ms (différence 42 %) (films/retour-arrière-390.png) _(390×844 retour arrière)_

## Non lancé

- **services extérieurs en direct** : pas d'accès à Internet dans l'environnement d'audit : api.open-meteo.com, api.rainviewer.com non joints ; le site a affiché son repli (relevé figé, radar indisponible)

## Repères

- Numéro de version des fichiers : ?v=2
- Audit standard : étapes lourdes sur /, /application, /commune, /contact, /radar, /vigilance.
- Accessibilité : axe-core 4.12.1 en plus des contrôles intégrés.
- Ouverture / (1366×768) : 2879 ms depuis le premier octet
- Ouverture /application (1366×768) : 2875 ms depuis le premier octet
- Ouverture /commune (1366×768) : 2912 ms depuis le premier octet
- Ouverture /contact (1366×768) : 2895 ms depuis le premier octet
- Ouverture /radar (1366×768) : 2749 ms depuis le premier octet
- Ouverture /vigilance (1366×768) : 2858 ms depuis le premier octet
- Ouverture / (390×844) : 2899 ms depuis le premier octet
- Ouverture /application (390×844) : 2887 ms depuis le premier octet
- Ouverture /commune (390×844) : 2899 ms depuis le premier octet
- Ouverture /contact (390×844) : 2907 ms depuis le premier octet
- Ouverture /radar (390×844) : 2851 ms depuis le premier octet
- Ouverture /vigilance (390×844) : 2864 ms depuis le premier octet
- Tient dans l'écran /application : aucune section épinglée ou plein écran.
- Tient dans l'écran /commune : aucune section épinglée ou plein écran.
- Tient dans l'écran /contact : aucune section épinglée ou plein écran.
- Tient dans l'écran /vigilance : aucune section épinglée ou plein écran.

## Fichiers

- Captures : `captures/` (téléphone, tablette, ordinateur, écran par écran)
- Films : `films/` (planches contact de l’ouverture, des transitions, des retours, des ancres et des épinglages ; ⚠ = image signalée)
- Comparaisons : `comparaisons/`
- Détail complet : `rapport.json`


## Relancer seulement ce qui a échoué

Après correction, si elle ne touche que ces pages (sinon, relancer l’audit standard en entier) :

```
node _audit/audit.mjs --seulement=fichiers,ecran
```
