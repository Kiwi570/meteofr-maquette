# Rapport d’audit

Projet : `meteofr-maquette` · 05/11/2026 17:33:42 · 3 min · 7 page(s) · audit standard (étapes : fichiers, mesures)

## Résumé

- Échecs : **0**
- À regarder : **1**
- Non lancé : **1**
- Contrôles passés : vercel.json (1), .vercelignore (1), robots.txt (1), numéro de version (1), langues (1), mesures (77), balayage (6)

## Échecs

Aucun.

## À regarder

### numéro de version (1)

- **numéro de version** — ?v=1 est celui de la dernière livraison : à changer avant de livrer

## Non lancé

- **services extérieurs en direct** : pas d'accès à Internet dans l'environnement d'audit : api.open-meteo.com, api.rainviewer.com non joints ; le site a affiché son repli (relevé figé, radar indisponible)

## Repères

- Numéro de version des fichiers : ?v=1
- Audit standard : étapes lourdes sur /, /application, /commune, /contact, /radar, /vigilance.
- Accessibilité : axe-core 4.12.1 en plus des contrôles intégrés.

## Fichiers

- Captures : `captures/` (téléphone, tablette, ordinateur, écran par écran)
- Films : `films/` (planches contact de l’ouverture, des transitions, des retours, des ancres et des épinglages ; ⚠ = image signalée)
- Comparaisons : `comparaisons/`
- Détail complet : `rapport.json`


## Relancer seulement ce qui a échoué

Après correction, si elle ne touche que ces pages (sinon, relancer l’audit standard en entier) :

```
node _audit/audit.mjs --seulement=fichiers,mesures
```
