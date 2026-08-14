Je veux développer MekaMemo, une application mobile d'entretien de véhicule pour iOS et Android.

Le dossier `design_handoff_mekamemo/` contient tout le design : commence par lire `design_handoff_mekamemo/README.md` en entier, puis ouvre `design_handoff_mekamemo/MekaMemo Ecrans.dc.html` dans un navigateur pour voir les 15 écrans (le sélecteur en haut à droite bascule sombre / clair).

Le HTML est une maquette de référence, pas du code de production. Recrée les écrans dans un vrai projet mobile — choisis React Native (Expo) sauf si tu vois une meilleure raison, et explique ton choix avant de commencer. N'embarque pas le HTML.

Ce qui existe : les 15 écrans, entièrement conçus, avec tous les jetons de couleur, de typographie et d'espacement listés dans le README.

Ce qui reste à construire, c'est le backend et le câblage de l'application :

1. Génération du calendrier d'entretien à partir du VIN (décodage VIN, intervalles constructeur en km et en mois).
2. Le moteur de projection du kilométrage. C'est le point de conception le plus important — lis attentivement la section « La solution au problème du kilométrage » du README avant d'implémenter les rappels. L'application ne connaît jamais le kilométrage en temps réel ; elle projette une date à partir d'une moyenne recalculée à chaque relevé.
3. Notifications poussées iOS et Android : demande de relevé mensuel, rappel d'entretien à 7 jours puis à échéance, réponse de garage.
4. Analyse de panne : description libre, étiquettes, photo, vidéo, audio en entrée ; cause probable avec niveau de confiance, hypothèses secondaires, délai, fourchette de coût, note de sécurité en sortie.
5. Recherche de garages géolocalisée, en interface conversationnelle.
6. Demande de soumission et réservation, par courriel avec repli sur appel vocal.
7. Téléversement des photos, vidéos, audio et factures, avec OCR sur les photos d'odomètre.
8. Comptes, authentification, plan gratuit et plan MEKAMEMO +.
9. Bilinguisme FR / EN de bout en bout, y compris le contenu généré par l'IA et les courriels aux garages.

Cinq contraintes à ne pas relâcher :

- Aucune réservation n'est confirmée sans validation explicite de l'utilisateur. C'est une exigence produit.
- Le kilométrage est toujours estimé, jamais mesuré.
- Le diagnostic est une hypothèse à confirmer par un garage, et les réponses doivent le dire.
- Bilingue partout.
- Deux plateformes, deux grammaires : les écrans 03 et 04 montrent le même contenu en conventions iOS puis Android. Suis cette distinction dans toute l'application.

Fidélité visuelle haute : couleurs, typographies, espacements et contenus sont définitifs. Les données affichées dans la maquette (Toyota RAV4, Marc Lavoie, les garages, les prix) sont des exemples, pas du contenu à coder en dur.

Commence par me proposer un plan : cadriciel retenu, structure du projet, schéma de base de données, et l'ordre dans lequel tu veux construire. Ne code rien avant que je valide le plan.
