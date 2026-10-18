# MekaMemo — mise en ligne web gratuite

Ce guide déploie l'app sur une vraie URL publique, accessible depuis n'importe quel
ordinateur ou téléphone (iOS/Android, dans le navigateur — aucune installation), en
utilisant uniquement des paliers gratuits. Compte à créer toi-même à chaque étape
(je ne peux pas créer de compte à ta place) — je te donne la marche à suivre exacte.

Architecture : le frontend (Expo web, export statique) et le backend (NestJS +
Postgres) sont hébergés séparément, comme deux sites indépendants qui se parlent
par API. C'est la manière standard — et gratuite — de faire tourner ce genre d'app.

| Composant | Service gratuit | Pourquoi celui-là |
|---|---|---|
| Base de données Postgres | [Neon](https://neon.tech) | Gratuit en permanence (pas de limite de 90 jours comme Render), se réveille tout seul à la première requête |
| Backend NestJS | [Render](https://render.com) | 750h/mois gratuites, déploiement automatique depuis GitHub |
| Fichiers uploadés (photos, factures) | [Cloudinary](https://cloudinary.com) | Optionnel mais recommandé — le disque gratuit de Render est effacé à chaque redémarrage |
| Frontend web | [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) | Hébergement statique gratuit, HTTPS automatique |
| Code source | [GitHub](https://github.com) | Requis par Render/Vercel pour le déploiement continu |

## 0. Limites à connaître (plans gratuits)

- **Render (backend)** : le service s'endort après ~15 min sans trafic. La première
  requête après une pause prend 30-60 secondes (l'app se réveille), les suivantes
  sont normales. Pas de solution gratuite pour éviter ça — c'est le compromis du
  100% gratuit.
- **Neon (base de données)** : se met aussi en pause après inactivité, se réveille
  automatiquement à la prochaine connexion (quelques secondes).
- **Sans clé Cloudinary** : les photos/factures uploadées disparaissent au prochain
  redémarrage de Render (le disque n'est pas persistant). Avec Cloudinary (gratuit,
  étape 4), elles sont conservées définitivement.
- **Garages** : la base contient ~29 000 garages du Canada (données ouvertes d'Overture
  Maps : adresse et téléphone), chargés automatiquement au démarrage depuis
  `apps/backend/prisma/data/garages-ca.ndjson.gz` — aucun service externe n'est appelé
  pendant une recherche, qui prend donc moins d'une seconde. La position de l'utilisateur
  vient d'OpenStreetMap (gratuit, sans clé). Les données viennent de sources publiques :
  quelques garages sont absents ou ont un numéro périmé, et il n'y a ni note ni horaires.
  Pour rafraîchir les données (quelques fois par an) :
  `pip install duckdb`, puis `python apps/backend/scripts/export-overture-garages.py
  --release <date>` (liste des versions dans l'en-tête du script), puis `git commit` et
  `git push` : le prochain déploiement recharge tout seul le nouveau fichier.
- **Clés IA optionnelles** (Anthropic, Google Places, etc.) : déjà couvertes dans
  [HANDOFF.md](HANDOFF.md) section 3 — l'app fonctionne très bien sans elles
  (replis déterministes), à ajouter plus tard si souhaité.

## 1. Pousser le code sur GitHub

1. Crée un compte gratuit sur [github.com](https://github.com) si tu n'en as pas.
2. Crée un nouveau dépôt **privé** vide (sans README) — par ex. `mekamemo`.
3. Dans un terminal, à la racine du projet (`D:\Scripts\MekaMemo\Mekamemo`) :

```bash
git remote add origin https://github.com/<ton-compte>/mekamemo.git
git add -A
git commit -m "Prepare free web hosting"
git push -u origin master
```

## 2. Créer la base de données (Neon)

1. Crée un compte gratuit sur [neon.tech](https://neon.tech) (connexion possible
   avec GitHub).
2. Crée un projet → une base `mekamemo`.
3. Dans le dashboard du projet, copie la **connection string** — choisis la version
   **"Direct connection"** (pas "Pooled connection" : le job de fond `pg-boss` et
   les migrations Prisma ont besoin d'une connexion directe, pas d'un pooler).
4. Garde cette URL de côté, elle sert de `DATABASE_URL` à l'étape suivante.

## 3. Déployer le backend (Render)

1. Crée un compte gratuit sur [render.com](https://render.com) (connexion avec
   GitHub recommandée — ça simplifie la suite).
2. Dashboard Render → **New +** → **Blueprint** → sélectionne ton dépôt `mekamemo`.
   Render détecte automatiquement `render.yaml` à la racine et propose de créer
   le service `mekamemo-backend`.
3. Avant de confirmer, Render te demande de remplir les variables marquées comme
   secrètes :
   - `DATABASE_URL` → colle la connection string Neon de l'étape 2.
   - `CORS_ORIGIN` → laisse vide pour l'instant (à remplir après l'étape 5).
   - `CLOUDINARY_URL` → laisse vide pour l'instant (optionnel, étape 4).
   - Les autres (`ANTHROPIC_API_KEY`, etc.) : laisse vide, voir HANDOFF.md.
4. Lance le déploiement. La première fois, Render exécute les migrations Prisma
   automatiquement (`prisma migrate deploy`, déjà configuré dans `render.yaml`).
5. Une fois déployé, note l'URL fournie par Render, du type
   `https://mekamemo-backend.onrender.com` — c'est ton URL d'API.
6. Vérifie que ça répond : ouvre `https://mekamemo-backend.onrender.com/` dans un
   navigateur (devrait répondre, même vide/200).

## 4. (Recommandé) Stockage persistant des photos — Cloudinary

Sans cette étape, l'app fonctionne, mais les photos d'odomètre/factures/pannes
uploadées sont perdues au prochain redémarrage de Render.

1. Crée un compte gratuit sur [cloudinary.com](https://cloudinary.com).
2. Sur le dashboard, copie la valeur **"API Environment variable"** — elle a la
   forme `cloudinary://<key>:<secret>@<cloud_name>`.
3. Retourne sur Render → ton service `mekamemo-backend` → **Environment** →
   colle cette valeur dans `CLOUDINARY_URL` → sauvegarde (Render redéploie
   automatiquement).

## 5. Déployer le frontend web (Vercel)

1. Crée un compte gratuit sur [vercel.com](https://vercel.com) (connexion avec
   GitHub recommandée).
2. **Add New** → **Project** → sélectionne le dépôt `mekamemo`.
3. Dans la configuration du projet :
   - **Root Directory** → `apps/mobile`
   - Le reste (build command, output) est déjà défini par
     `apps/mobile/vercel.json` — Vercel le détecte automatiquement.
4. Dans **Environment Variables**, ajoute :
   - `EXPO_PUBLIC_API_BASE_URL` = l'URL Render de l'étape 3
     (ex. `https://mekamemo-backend.onrender.com`)
5. **Deploy**. Après quelques minutes, Vercel donne une URL du type
   `https://mekamemo.vercel.app` — c'est l'app, utilisable telle quelle sur
   ordinateur ou téléphone.

*(Alternative : Netlify fonctionne pareil avec `apps/mobile/netlify.toml` déjà
prêt — mêmes étapes, root directory `apps/mobile`, variable d'env identique.)*

## 6. Verrouiller le CORS (sécurité)

Une fois l'URL Vercel connue :

1. Retourne sur Render → `mekamemo-backend` → **Environment**.
2. Renseigne `CORS_ORIGIN` = `https://mekamemo.vercel.app` (ton URL Vercel exacte,
   sans `/` à la fin). Plusieurs origines possibles, séparées par des virgules.
3. Sauvegarde → Render redéploie. Sans cette étape, l'API accepte n'importe quelle
   origine (fonctionne, mais moins strict).

## 7. Tester

Ouvre l'URL Vercel sur ton ordinateur, puis sur ton téléphone (Safari sur iPhone,
Chrome sur Android) — même URL, aucune installation. Le premier chargement après
une période d'inactivité peut prendre 30-60 secondes le temps que Render (et
Neon) se réveillent ; les suivants sont instantanés.

## Mettre à jour l'app plus tard

Chaque `git push` sur la branche déployée redéclenche automatiquement le build et
le déploiement, sur Render comme sur Vercel — rien d'autre à faire.
