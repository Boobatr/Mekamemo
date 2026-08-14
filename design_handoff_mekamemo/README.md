# Handoff : MekaMemo — application mobile d'entretien de véhicule

## Vue d'ensemble

MekaMemo est une application mobile (iOS et Android) qui tient la mémoire d'entretien d'un véhicule à la place de son propriétaire. Elle génère un calendrier d'entretien à partir des recommandations du fabricant, envoie les rappels au bon moment, laisse l'utilisateur signaler une panne dans ses mots, propose un diagnostic, trouve des garages et prend le rendez-vous — toujours avec confirmation explicite de l'utilisateur avant tout engagement.

Usage visé : particuliers et petites flottes commerciales. Marché premier : Québec, interface en français avec sélecteur FR / EN.

**Portée de cette phase : mobile uniquement.** Aucune version ordinateur n'est prévue pour l'instant.

## À propos des fichiers de design

Les fichiers HTML de ce dossier sont des **références de design**, pas du code de production. Ce sont des maquettes qui montrent l'apparence et le comportement voulus.

Le travail consiste à **recréer ces écrans dans l'environnement cible** (React Native, Flutter, Swift/Kotlin natif — au choix) en suivant ses conventions et ses bibliothèques. Si aucun environnement n'existe encore, choisir le cadriciel le plus approprié pour une application mobile bilingue à deux plateformes et y implémenter les écrans. Ne pas embarquer le HTML tel quel.

`MekaMemo Ecrans.dc.html` est un plan de travail unique qui contient les 15 écrans côte à côte, à l'échelle 390 × 844. Ouvrir le fichier dans un navigateur pour le consulter. Le sélecteur Sombre / Clair en haut à droite bascule le thème complet.

## Fidélité

**Haute fidélité.** Couleurs, typographies, espacements et contenus sont définitifs et doivent être reproduits fidèlement. Les valeurs exactes sont listées dans la section Jetons de design.

Deux réserves : les photos de véhicules sont des emplacements vides à remplir par l'utilisateur, et les données affichées (Toyota RAV4, Marc Lavoie, garages, prix) sont des exemples, pas du contenu à coder en dur.

## Les 15 écrans

L'ordre suit le parcours réel de l'utilisateur.

**01 — Profil utilisateur.** Onboarding, étape 1 sur 3. Nom, courriel, téléphone, code postal, rayon de recherche, langue FR / EN. Ces informations servent à personnaliser les courriels envoyés aux garages et à géolocaliser la recherche. Mention explicite : les données restent sur l'appareil jusqu'à l'envoi d'une demande.

**02 — Ajout d'un véhicule.** Saisie du VIN (ou marque / modèle / année manuellement), kilométrage actuel, photo du véhicule. Le VIN alimente la génération du calendrier.

**03 — Tableau de bord (iOS).** Liste des véhicules avec prochaine échéance, kilométrage, barre de progression vers la prochaine intervention, étiquettes d'état. Barre d'onglets iOS en bas : Véhicules, Calendrier, Garages, Réglages.

**04 — Tableau de bord (Android).** Même contenu, conventions Android : barre d'application avec menu hamburger, bouton d'action flottant carré, barre de navigation système en bas.

**05 — Calendrier IA.** Liste chronologique des entretiens générés par l'IA à partir des recommandations du fabricant, groupés par échéance.

**06 — Édition d'une tâche.** L'utilisateur peut ajuster une intervention proposée : décaler, marquer comme faite, supprimer, modifier l'intervalle.

**07 — Relevé du kilométrage.** Écran central de la solution de rappel (voir la section suivante). Trois valeurs estimées proposées en un tap, saisie manuelle, photo de l'odomètre lue par OCR, moyenne mensuelle avec graphique à barres sur six mois, projection de la prochaine échéance, interrupteur optionnel pour le relevé automatique par les trajets du téléphone.

**08 — Notifications.** Centre de rappels : entretiens à venir, demandes de relevé, réponses de garages.

**09 — Signaler une panne.** Champ de description libre, en langage courant. Pièces jointes : photo, vidéo, enregistrement audio du bruit. Étiquettes de précision en un tap (depuis quand, témoin allumé, au freinage, fuite visible, odeur). Bouton « Analyser le problème ».

**10 — Diagnostic et prise en charge.** Résultat de l'analyse IA : cause la plus probable avec niveau de confiance, deux ou trois autres pistes, délai conseillé, fourchette de coût, note de sécurité, garages disponibles. Actions : « Demander 3 soumissions » ou « Ajouter au calendrier ».

**11 — Recherche de garages.** Interface conversationnelle : l'utilisateur décrit son besoin, l'IA propose des ateliers avec distance, disponibilité et note.

**12 — Fiche garage.** Détail d'un atelier : coordonnées, spécialités, disponibilités, avis, historique de vos visites.

**13 — Réservation confirmée.** Récapitulatif du rendez-vous après confirmation explicite de l'utilisateur.

**14 — Historique.** Interventions passées groupées par année, avec date, kilométrage, garage et coût. Les factures jointes forment un dossier de revente exportable.

**15 — Réglages et abonnement.** Profil, langue FR / EN, unités km / mi, contact automatique des garages, appels vocaux si aucun courriel, confirmation avant chaque réservation, plan MEKAMEMO +.

## La solution au problème du kilométrage

C'est le point de conception le plus important du produit, à lire avant d'implémenter les rappels.

L'application ne connaît pas le kilométrage en temps réel — aucun accès au véhicule. Un rappel de vidange fondé sur des kilomètres est donc impossible tel quel. La solution retenue est une **projection recalibrée**.

1. À l'ajout du véhicule, l'utilisateur saisit son kilométrage actuel.
2. Chaque relevé successif alimente une **moyenne de kilomètres par mois** (dans la maquette : 1 380 km/mois calculés sur quatre relevés).
3. L'application projette la date à laquelle le seuil sera atteint : `date_estimée = aujourd'hui + (km_restants / moyenne_quotidienne)`.
4. Une fois par mois, une notification demande le relevé. Elle propose **trois valeurs estimées** à partir de la moyenne — un seul tap suffit. Alternative : photographier l'odomètre, un OCR lit le chiffre.
5. Chaque nouveau relevé **recalcule la date**. Si l'utilisateur roule moins, l'échéance recule d'elle-même ; s'il roule plus, elle avance.
6. Option facultative : détection des trajets par le téléphone (GPS ou CarPlay / Android Auto) pour affiner la moyenne sans saisie.

Le rappel d'entretien part 7 jours avant la date projetée, puis à la date même.

Conséquences côté backend : conserver l'historique complet des relevés (date, valeur, source : manuel, OCR, estimation, GPS), recalculer la moyenne et toutes les projections du véhicule à chaque nouveau relevé, et replanifier les notifications en conséquence.

## Ce qui reste à construire — le travail backend

Les maquettes couvrent l'interface. Voici ce que le backend doit fournir.

### Génération du calendrier d'entretien

À partir du VIN (ou marque / modèle / année), produire la liste des interventions recommandées par le fabricant avec leurs intervalles en kilomètres et en mois. Source : décodage VIN puis base de données d'entretien constructeur, complétée par un appel au modèle pour les véhicules mal couverts. Chaque intervention porte un seuil km, un seuil temps, et la règle du premier atteint.

### Projection et planification

Le moteur décrit à la section précédente. À implémenter comme un service qui, pour un véhicule donné, recalcule à chaque relevé la moyenne, les dates projetées de chaque intervention et les notifications planifiées.

### Notifications

Notifications poussées iOS et Android. Trois familles : demande de relevé mensuel, rappel d'entretien à 7 jours puis à échéance, réponse d'un garage. Respecter la langue choisie par l'utilisateur.

### Analyse d'une panne

Recevoir la description libre, les étiquettes de précision, les pièces jointes (photo, vidéo, audio) et l'historique du véhicule. Retourner : cause la plus probable avec un niveau de confiance, deux ou trois hypothèses secondaires, un délai conseillé, une fourchette de coût, une note de sécurité. La réponse doit toujours signaler qu'il s'agit d'une estimation à confirmer par un garage.

### Recherche de garages

Recherche géolocalisée dans le rayon défini au profil, filtrée par spécialité et disponibilité. Interface conversationnelle : l'utilisateur pose sa question en langage naturel, le backend interroge la source de données et formule la réponse.

### Demande de soumission et réservation

Envoi de la demande au garage par courriel, avec repli sur un appel vocal de l'assistant si aucune adresse n'est disponible (option activable dans les réglages). **Contrainte stricte : aucune réservation n'est confirmée sans validation explicite de l'utilisateur.** L'écran 13 n'apparaît qu'après cette confirmation.

### Photos et pièces jointes

Téléversement et stockage des photos de véhicule, des photos d'odomètre (avec OCR), des photos et vidéos de panne, des enregistrements audio et des factures. Les factures alimentent le dossier de revente exportable en PDF de l'écran 14.

### Comptes et abonnement

Authentification, profil, plan gratuit et plan MEKAMEMO + (véhicules illimités, appels vocaux, dossier de revente, rappels avancés).

### Bilinguisme

Tout contenu généré — calendrier, diagnostic, courriels aux garages, notifications — doit respecter la langue choisie. Le sélecteur FR / EN est présent à l'onboarding et dans les réglages.

## Jetons de design

Le thème bascule intégralement entre sombre et clair. Les deux jeux de valeurs sont donnés ci-dessous. En mode sombre, les surfaces sont translucides pour laisser transparaître la photo d'atelier en arrière-plan ; en mode clair, la photo est entièrement masquée par un fond bleu-papier pâle.

### Couleurs — mode sombre

| Rôle | Valeur |
| --- | --- |
| Fond d'écran | `rgba(15,19,23,.5)` sur la photo |
| Voile haut / bas | `rgba(11,14,18,.62)` → `rgba(11,14,18,.86)` |
| Texte principal | `#e8edf3` |
| Texte secondaire | `#9aa6b3` |
| Texte tertiaire | `#7e8894` |
| Texte discret | `#6d7783` |
| Fond de champ | `rgba(23,29,36,.62)` |
| Rail / piste | `#2b333c` |
| Accent | `#1d6ef5` |
| Accent survol | `#4a8dff` |
| Accent sur fond sombre | `#5fa2ff` |
| Texte sur teinte accent | `#bcd9ff` |
| Panneau accent plein | `#0d2748` (texte blanc, marques `#6fa8ff`) |
| Filets | `rgba(232,237,243,.22)` / `.16` / `.12` / `.09` / `.07` |
| Teintes accent | `rgba(29,110,245,.22)` / `.20` / `.18` / `.14` / `.12` |

### Couleurs — mode clair

| Rôle | Valeur |
| --- | --- |
| Fond d'écran | `#f4f6f9` → `#eceff4` |
| Texte principal | `#141a22` |
| Texte secondaire | `#55606d` |
| Texte tertiaire | `#78838f` |
| Texte discret | `#9aa4b0` |
| Fond de champ | `#ffffff` |
| Rail / piste | `#d4d4d7` |
| Accent | `#1d6ef5` |
| Accent survol | `#1558c8` |
| Accent sur fond clair | `#1558c8` |
| Texte sur teinte accent | `#17457f` |
| Filets | `rgba(29,44,64,.32)` / `.22` / `.15` / `.11` / `.08` |
| Teintes accent | `rgba(29,110,245,.14)` / `.12` / `.10` / `.08` / `.06` |

### Typographie

Deux familles, chargées depuis Google Fonts.

- **Barlow Condensed** — titres, étiquettes, boutons, chiffres. Graisses 500, 600, 700.
- **Barlow** — texte courant. Graisses 400, 500, 600.

| Usage | Police | Taille | Graisse | Interlettrage |
| --- | --- | --- | --- | --- |
| Titre d'écran | Barlow Condensed | 30 px | 600 | 0 |
| Grand titre (onboarding) | Barlow Condensed | 34 px | 600 | −.01em |
| Titre de carte | Barlow Condensed | 20–26 px | 600 | 0 |
| Chiffre vedette | Barlow Condensed | 38 px | 600 | 0 |
| Étiquette de section | Barlow Condensed | 11–12 px | 500 | .14–.16em, majuscules |
| Bouton | Barlow Condensed | 16–18 px | 600 | .08em, majuscules |
| Texte courant | Barlow | 15 px | 400 | 0 |
| Texte secondaire | Barlow | 13–14 px | 400 | 0 |
| Barre d'état | Barlow | 12 px | 600 | 0 |

### Espacement

Échelle dérivée d'une densité de 0,85 : 4 / 6,8 / 10,2 / 13,6 / 16 / 20,4 px. Marge intérieure des écrans : 20,4 px horizontal, 16 px vertical.

### Formes

- **Rayon de bordure : 0 partout, sauf les boutons à 7 px.** Cartes, champs, étiquettes et panneaux sont à angles vifs.
- Cartes et boutons principaux portent quatre **marques de repérage** en forme de `+`, aux quatre coins, en couleur accent, 11 px, décalées de −6 px vertical et −4 px horizontal.
- Bordures : 1 px, filets translucides selon le thème.
- Ombres : uniquement sur les cartes et boutons Android, `0 1px 2px rgba(0,0,0,.6)` et `0 3px 10px rgba(0,0,0,.55)`.

### Géométrie des écrans

390 × 844 px. Barre d'état iOS 44 px, indicateur d'accueil 22 px. Barre d'état Android 32 px, barre d'application 56 px, barre d'onglets 62 px, barre système 20 px.

## Icônes

Lucide, épaisseur de trait 1,5. Les icônes de la maquette sont des SVG en ligne repris de ce jeu.

## Actifs

- `assets/atelier-ecran.png` — photo d'atelier fournie par le client, recadrée en vertical, utilisée comme fond d'écran sous un voile. Positionnement : `object-fit: cover`, `object-position: 82% 42%`, `saturate(1.06)`.
- `assets/atelier.png` — même photo, cadrage horizontal, utilisée comme fond du plan de travail.
- Emplacements photo dans les maquettes (véhicules) : vides, à remplir par l'utilisateur dans l'application.

Aucune image n'est générée. Les photos de véhicule proviennent de l'appareil de l'utilisateur.

## Fichiers de ce dossier

- `MekaMemo Ecrans.dc.html` — le plan de travail complet, 15 écrans. Ouvrir dans un navigateur.
- `support.js`, `image-slot.js` — dépendances techniques de la maquette. Sans intérêt pour l'implémentation.
- `assets/` — les photos de fond.

## Points de vigilance

1. **Aucune réservation sans confirmation explicite.** C'est une exigence produit, pas un détail d'interface.
2. **Le kilométrage est estimé, jamais mesuré.** Toute la logique de rappel repose sur la projection recalibrée décrite plus haut.
3. **Le diagnostic est une hypothèse.** L'interface le dit ; le backend doit le refléter dans ses réponses.
4. **Bilingue de bout en bout**, y compris le contenu généré par l'IA et les courriels aux garages.
5. **Deux plateformes, deux grammaires.** Les écrans 03 et 04 montrent le même contenu en conventions iOS puis Android. Suivre cette distinction sur l'ensemble de l'application.
