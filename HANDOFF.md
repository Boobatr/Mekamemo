# MekaMemo — guide de mise en production

Ce document résume l'état du projet, ce qu'il reste à fournir côté comptes/clés, et les étapes de publication sur les stores.

## 1. État des tests (dernière exécution)

| Suite | Résultat |
|---|---|
| Backend — unitaires | 25/25 ✅ |
| Backend — e2e (Postgres embarqué) | 40/40 ✅ |
| Mobile — composants/écrans/navigation | 64/64 ✅ |
| `tsc --noEmit` (backend + mobile) | propre, 0 erreur |

Vérification manuelle supplémentaire faite dans un navigateur avec le vrai backend (Postgres + NestJS) : inscription → décodage VIN réel (NHTSA vPIC) → génération du calendrier d'entretien → tableau de bord → calendrier → réglages, en français et en anglais.

## 2. Bugs trouvés pendant l'audit final et corrigés

Ces trois problèmes n'étaient pas couverts par les tests automatisés (ils touchaient au câblage des vraies données, pas à la logique testée isolément) et n'ont été repérés qu'en faisant tourner l'app contre le vrai backend :

1. **CORS manquant** sur le backend (`main.ts`) — bloquait tout appel du web/app vers l'API. Ajout de `app.enableCors()`.
2. **Calendrier d'entretien** : le kilométrage affiché était figé à `0` et la mention de source était codée en dur (« guide d'entretien Toyota 2021 ») quel que soit le véhicule — un vestige de l'écran construit sur données fictives. Le kilométrage réel et la vraie source (BD constructeur / estimation IA / intervalles standards, selon ce qui a réellement généré le calendrier) sont maintenant transmis de bout en bout, avec une nouvelle migration Prisma (`scheduleSource`, `scheduleGeneratedAt` sur `Vehicle`) et un `latestOdometerKm` calculé côté API.
3. **Écran Réglages** : la description du plan affichait toujours le argumentaire MEKAMEMO+ (« véhicules illimités... ») même pour un compte gratuit, et le mot « Gratuit » restait en français même en mode anglais. Corrigé : description et titre du plan gratuit ajoutés à l'i18n FR/EN, et affichés seulement quand l'utilisateur n'est pas Plus.

Aucun de ces bugs n'affecte les cinq garde-fous produits du projet (confirmation explicite des réservations, kilométrage toujours présenté comme une projection, diagnostic toujours présenté comme une hypothèse, bilinguisme de bout en bout, conventions iOS/Android distinctes) — ils restent tous appliqués et testés.

## 3. Comptes et clés API à fournir avant le lancement

Toutes les fonctionnalités concernées ont un **repli fonctionnel et testé** en l'absence de la clé — rien ne bloque un lancement progressif, mais chaque case cochée débloque une vraie fonctionnalité au lieu de son équivalent générique.

Ces valeurs se placent dans `apps/backend/.env` (actuellement toutes vides) :

- [ ] `ANTHROPIC_API_KEY` — active la génération IA du calendrier d'entretien (véhicules sans fiche constructeur en base) et le diagnostic de panne multimodal. Sans elle : intervalles génériques de l'industrie + repli déterministe pour le diagnostic.
- [ ] `GOOGLE_PLACES_API_KEY` — optionnelle (carte bancaire requise chez Google). Géocodage Google du code postal. Sans elle : OpenStreetMap gratuit si `OSM_ENABLED=true` (recommandé, aucune clé), sinon position fixe (Montréal).
- [x] `OSM_ENABLED=true` — géocodage gratuit du code postal (OpenStreetMap) et masquage des 3 garages d'exemple (`source = 'demo'`). Les garages réels viennent du jeu de données Overture Maps chargé en base au démarrage (`npm run import:garages`, voir DEPLOY.md). `OSM_GARAGE_DISCOVERY=true` ajoute en plus une recherche en direct dans OpenStreetMap (désactivée par défaut).
- [ ] `EMAIL_PROVIDER_API_KEY` (Resend) — envoi réel des courriels aux garages pour les demandes de soumission. Sans elle : les courriels sont journalisés, pas envoyés.
- [ ] `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — appels vocaux automatisés vers les garages sans courriel (fonctionnalité MEKAMEMO+). Sans elles : appel non déclenché, journalisé seulement.
- [ ] `REVENUECAT_API_KEY` / `REVENUECAT_WEBHOOK_SECRET` — gestion réelle des abonnements MEKAMEMO+ (achat in-app, renouvellement, webhook de statut). **À faire avant tout lancement payant.**
- [ ] `EXPO_PUSH_ACCESS_TOKEN` — notifications push réelles (rappels d'entretien, réponses de garage). Sans lui : notifications journalisées, pas envoyées sur l'appareil.
- [ ] `EMAIL_INBOUND_WEBHOOK_SECRET` — sécurise le webhook qui reçoit les réponses des garages par courriel entrant.

## 4. Comptes développeur et soumission aux stores

- [ ] **Compte Apple Developer** (99 $ US/an) — nécessaire pour TestFlight et l'App Store.
- [ ] **Compte Google Play Console** (25 $ US, paiement unique) — nécessaire pour les tests fermés et le Play Store.
- [ ] **Compte Expo/EAS** — build et soumission gérés via `eas build` puis `eas submit` (déjà configuré pour Expo SDK 57 ; un `eas.json` reste à créer avec les profils `development`/`preview`/`production`).
- [ ] Icônes, écran de démarrage et captures d'écran des stores — à produire à partir de la charte du mockup (`design_handoff_mekamemo/`).
- [ ] Politique de confidentialité et conditions d'utilisation publiées (liens requis par les deux stores) — l'app renvoie déjà vers des écrans « Confidentialité »/« Aide » à brancher sur ces URLs.
- [ ] Fiche de confidentialité Apple (« App Privacy ») et formulaire Data Safety Google Play — à remplir en fonction des données réellement collectées (courriel, téléphone, localisation approximative, photos/factures si l'utilisateur les téléverse).

## 5. Faire tourner le projet en local

```bash
# Backend (Postgres embarqué, aucun Docker requis)
cd apps/backend
node scripts/dev-db.js      # démarre Postgres, le laisse tourner
npm run start:dev           # dans un autre terminal

# Mobile (web, pour prévisualisation rapide)
cd apps/mobile
npm run web

# Tests
cd apps/backend && npm test && npm run test:e2e
cd apps/mobile && npm test
```

## 6. Ce qui est livré

Les 15 écrans du mockup, en français et anglais, avec navigation adaptée iOS/Android, branchés de bout en bout sur un vrai backend NestJS/PostgreSQL : décodage VIN, génération et projection du calendrier d'entretien, relevés de kilométrage, notifications, diagnostic de panne par IA, recherche de garages avec devis/réservation à confirmation explicite, historique/factures/export de dossier de revente, abonnement MEKAMEMO+ et réglages. Voir `design_handoff_mekamemo/README.md` pour la spécification produit d'origine.
