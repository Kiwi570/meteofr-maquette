# Journal des versions

## v2 · 5 novembre 2026 · « le site a la même météo que dehors »

**Accueil** (resserré sur ordinateur : 14,7 écrans de défilement en v1, 11,5 en v2 ; 12,6 sur téléphone)
- Ciel réel en WebGL dans l'ouverture : les nuages avancent dans la direction et à la vitesse du vent réel, leur densité suit la couverture nuageuse, le soleil ou la lune brillent à leur vraie position ; la photo suit légèrement la souris.
- « Maintenant » : un champ de vent (filets d'air dans la vraie direction, rafales) traverse la section ; les chiffres des jauges défilent.
- « 24 heures » en accéléré : la section reste à l'écran, le défilement fait avancer l'heure ; le ciel passe du jour à la nuit selon la vraie hauteur du soleil, les étoiles s'allument, l'heure et la température s'affichent en grand.
- Vigilance : carte agrandie, la couleur se répand comme une encre depuis le département le plus touché ; les départements en orange se soulèvent et pulsent.
- Radar : anneaux de 100, 200 et 300 km, point de la commune qui pulse, faisceau continu, heure en grand ; la section n'est plus épinglée.
- Seize jours : ruban des bandes de chaleur (une couleur par jour, gouttes sur les jours de pluie) ; toucher un jour le montre dans le détail.
- Grandes villes : les cartes glissent au défilement, sans épinglage.
- L'appli : section épinglée sur un écran, le grand téléphone change d'écran à chaque étape (recherche tapée lettre à lettre, direct, radar, alerte).
- Sources : radiosondage, le ballon de la photo monte, l'altimètre compte jusqu'à 30 000 m, la température et la pression chutent (atmosphère type), le ballon gonfle, éclate et redescend en parachute.

**Ma commune**
- Une seule grande vitre au lieu de quatre carreaux ; gouttes plus présentes par temps couvert, givre sous 1 °C, reflet de soleil par ciel clair.
- Herbes au vent : la photo ondule (WebGL) à la force et dans le sens du vent réel.
- Coucher de soleil au défilement : le soleil parcourt son arc, le ciel de la section change de teinte, les étoiles s'allument ; repère « maintenant » sur l'arc.
- Zoom sur le département piloté par le défilement ; seize jours avec le jour en cours mis en avant et des gouttes sur les jours de pluie.

**Radar & carte**
- Ouverture : anneaux de distance, point de la commune et grain d'écran radar.
- Carte de chaleur : la température est interpolée entre les vingt villes et découpée sur la France ; elle glisse quand on passe de Matin à Après-midi.
- « Lire le radar » : une averse traverse la carte au défilement, la légende et les conseils s'allument à son passage.

**Vigilance**
- Nuancier : la bande du niveau du jour pulse une fois remplie.
- Crue sous l'eau : la photo est vue à travers une eau qui bouge (WebGL), le niveau monte au défilement.
- Carte à l'encre et plus grande ; survoler un département allume sa ligne dans la liste, et inversement.
- « Que faire selon la couleur » : trois planches jaune, orange et rouge qui s'empilent au défilement, chacune avec trois réflexes.

**Application**
- Émergence : les nuages devant le téléphone s'écartent, son écran s'allume.
- Fonctions : un téléphone reste à l'écran et montre chaque fonction tour à tour (recherche, direct, radar, vigilance, favoris, seize jours).
- Installation en direct : barre de téléchargement et état du téléphone qui suivent les quatre étapes.

**Contact et 404**
- Formulaire en trois étapes numérotées, grandes cartes de sujet ; le ballon monte d'un cran à chaque champ rempli (altitude affichée).
- 404 : « 404 » écrit dans la buée.

**Partout**
- Voile de changement de page en front de nuages ; altimètre des sections sur grand écran.
- Corrigé : les couleurs des températures manquaient sur les vignettes des seize jours hors ligne ; les cartes des grandes villes passaient par-dessus « Seize jours ».

## v1 · 5 novembre 2026 · première version « Ciel vivant »

La base de la maquette :
- **Sept pages** : accueil, Ma commune (une fiche pour toutes les communes), Radar & carte, Vigilance, Application, Contact, 404, chacune avec une ouverture différente.
- **Données en direct** : prévisions et recherche de communes Open-Meteo, images radar RainViewer ; relevé réel du 5 novembre 2026 en repli hors ligne et sans JavaScript.
- **Vigilance** : relevé de démonstration figé du 5 novembre 2026 (Météo-France), aujourd'hui et demain, lien vers le site officiel.
- **Intro « jour-qui-se-lève »** à chaque arrivée et rechargement ; voile « front » entre les pages ; mode calme complet.
- **16 illustrations générées** (8 états du ciel, 8 scènes), recadrées en paysage et en portrait, toutes marquées « Illustration générée ».
- **Logo** redessiné en SVG d'après l'icône d'appli, favicon et icône iPhone.
- **Images de partage** 1200 × 630 par page, données structurées, noindex, en-têtes de sécurité.
- **À brancher** : lien de téléchargement de l'APK, envoi du formulaire de contact, source officielle de la vigilance.
