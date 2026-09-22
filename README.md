# DeWit

Backend Directus pour la gestion des tapisseries de la Manufacture DeWit : artistes, partenaires commerciaux, localisation et propriété des pièces, catalogues, nettoyage, ventes, photos, etc.

## Stack

- **[Directus](https://directus.io/)** (12.4) — API et interface d'administration
- **PostgreSQL 17 / PostGIS 3.5** (image `imresamu/postgis`, multi-arch amd64/arm64)
- **Redis 7** — cache Directus
- Orchestré via **Docker Compose**

## Structure du dépôt

```
.
├── docker-compose.yaml   # Services database / cache / directus
├── .env.example          # Modèle des variables d'environnement (sans secrets)
├── db/
│   ├── dewit_2026_05_generate.sql   # Script de création du schéma (tables, contraintes, FK)
│   └── test_data.sql                # Jeu de données de test/démo (voir plus bas)
├── snapshots/
│   └── snapshot.yaml     # Snapshot du schéma Directus (collections, champs, relations)
├── backups/
│   ├── dewit_initial.dump      # Backup : schéma seul, base vide
│   └── dewit_test_data.dump    # Backup : schéma + données de test
├── uploads/               # Fichiers uploadés dans Directus (volume monté)
├── extensions/             # Extensions Directus (volume monté)
└── data/                   # Données PostgreSQL (volume monté, ignoré par git)
```

## Démarrage

### 1. Configurer l'environnement

```bash
cp .env.example .env
```

Remplir `.env` avec des valeurs propres à ton installation :

- `DIRECTUS_SECRET` : générer avec `openssl rand -hex 32`
- `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD` : identifiants du compte admin créé au premier démarrage
- `DIRECTUS_DB_PASSWORD` : mot de passe de la base

`.env` n'est jamais versionné (voir `.gitignore`).

### 2. Lancer les services

```bash
docker compose up -d
```

Au premier démarrage, Directus initialise sa base et crée le compte admin défini dans `.env`. L'interface est ensuite disponible sur [http://localhost:8055](http://localhost:8055) (ou le port défini par `DIRECTUS_PORT`).

### 3. Charger le schéma métier

Le premier démarrage ne crée que les tables internes de Directus (`directus_*`). Les tables métier (`tapestry`, `artist`, `businesspartner`, ...) viennent du script SQL :

```bash
docker compose exec -T database psql -U "$DIRECTUS_DB_USER" -d "$DIRECTUS_DB_NAME" \
  < db/dewit_2026_05_generate.sql
```

> Le fichier contient des `DROP TABLE` en tête, à retirer si la base est déjà vide (premier import).

Puis appliquer le snapshot Directus pour enregistrer les collections, champs et relations dans l'interface d'administration (`snapshots/` n'étant pas monté dans le conteneur, on copie d'abord le fichier) :

```bash
docker compose cp snapshots/snapshot.yaml directus:/tmp/snapshot.yaml
docker compose exec -T directus node cli.js schema apply --yes /tmp/snapshot.yaml
```

> Le CLI Directus s'invoque via `node cli.js ...` dans l'image v12 — `npx` n'y est pas disponible.

## Injecter une base de backup via Docker

Les backups sont des dumps PostgreSQL au format custom (`pg_dump -F c`), restaurables avec `pg_restore`.

| Fichier | Contenu |
|---|---|
| `backups/dewit_initial.dump` | Schéma complet, base vide — point de départ propre |
| `backups/dewit_test_data.dump` | Schéma + jeu de données de test (tapisseries, partenaires, localisations, ventes, ...) |

### Restaurer un backup

Avec les conteneurs démarrés (`docker compose up -d`) :

```bash
docker compose exec -T database pg_restore \
  -U "$DIRECTUS_DB_USER" -d "$DIRECTUS_DB_NAME" \
  --clean --if-exists \
  < backups/dewit_test_data.dump
```

- `--clean --if-exists` supprime les objets existants avant de les recréer, pour repartir d'un état propre.
- Remplace `dewit_test_data.dump` par `dewit_initial.dump` pour repartir d'une base vide.
- Les variables `$DIRECTUS_DB_USER` / `$DIRECTUS_DB_NAME` viennent de `.env` (`set -a; . ./.env; set +a` avant la commande si elles ne sont pas déjà exportées dans le shell).

Après une restauration, redémarrer Directus pour qu'il resynchronise son cache de schéma :

```bash
docker compose restart directus
```

### Régénérer un backup

```bash
docker compose exec -T database pg_dump \
  -U "$DIRECTUS_DB_USER" -d "$DIRECTUS_DB_NAME" \
  -F c -f /tmp/backup.dump
docker compose cp database:/tmp/backup.dump backups/mon_backup.dump
```