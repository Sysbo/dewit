# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Directus backend for Manufacture DeWit's tapestry inventory: artists, business partners, tapestry location/ownership history, sales, catalogues, cleaning history and pictures. There is no application code — this repo is a Docker Compose stack (Directus + PostgreSQL/PostGIS + Redis) plus the SQL that defines and seeds the domain schema, since Directus manages collections/fields/relations as data inside its own metadata tables rather than through migration files.

## Commands

```bash
cp .env.example .env        # fill in DIRECTUS_SECRET (openssl rand -hex 32), admin creds, DB password
docker compose up -d        # start database, cache, directus
docker compose logs directus --tail 50   # check startup / migration errors
```

Directus UI/API: `http://localhost:8055` (or `$DIRECTUS_PORT`).

### Loading the domain schema (first run only)

Directus's own first boot only creates its internal `directus_*` tables. The domain tables come from a separate SQL file, then get registered as Directus collections via a schema snapshot:

```bash
# 1. Create the domain tables (strip the leading DROP TABLE statements on a fresh DB)
docker compose exec -T database psql -U "$DIRECTUS_DB_USER" -d "$DIRECTUS_DB_NAME" \
  < db/dewit_2026_05_generate.sql

# 2. Register collections/fields/relations in Directus from the snapshot
docker compose cp snapshots/snapshot.yaml directus:/tmp/snapshot.yaml
docker compose exec -T directus node cli.js schema apply --yes /tmp/snapshot.yaml
```

Note: the Directus 12 image has no `npx` — invoke the CLI as `node cli.js ...` inside the container.

### Restoring / seeding data

Backups are `pg_dump -F c` (custom format) dumps, restored with `pg_restore`:

```bash
docker compose exec -T database pg_restore \
  -U "$DIRECTUS_DB_USER" -d "$DIRECTUS_DB_NAME" \
  --clean --if-exists \
  < backups/dewit_test_data.dump      # or backups/dewit_initial.dump for an empty schema
docker compose restart directus       # resync Directus's schema cache after a restore
```

`db/test_data.sql` (a plain, transaction-wrapped SQL script, not a pg_dump) can be replayed directly on an *empty* schema instead of restoring a full dump — it inserts fixed IDs, so it will fail or corrupt data if the tables already contain rows. Reset sequences (`ALTER SEQUENCE ..._id_seq RESTART WITH 1`) or restore `dewit_initial.dump` first if reseeding.

There is no test suite, linter, or build step in this repo.

## Architecture

**Schema lives in two places that must stay in sync:**
1. `db/dewit_2026_05_generate.sql` — the actual PostgreSQL DDL (tables, PK/FK constraints, indexes). This is the source of truth for column types and constraints.
2. `snapshots/snapshot.yaml` — Directus's own metadata (collection icons/display templates, field interfaces/widths, M2O/O2M relation aliases). This is a `directus schema snapshot` export and must be regenerated after any change made through the Directus admin UI or API, so it stays committed and re-appliable elsewhere:
   ```bash
   docker compose exec -T directus node cli.js schema snapshot --yes /tmp/snapshot.yaml
   docker compose cp directus:/tmp/snapshot.yaml snapshots/snapshot.yaml
   ```

Editing one without the other will desync the DB schema from what Directus's UI/API expose. When adding a table/column by hand in SQL, also register it as a Directus collection/field (via the admin UI, then re-export the snapshot) — Directus won't discover raw tables on its own.

**Domain model** centers on `tapestry`, linked to:
- `artist`, `orientation` — descriptive attributes
- `businesspartner` (customers/suppliers/self) via `bprelationship`/`relationtype`
- `location` / `sublocation` / `tapestrylocation` — location history over time
- `ownership` — ownership history over time
- `salesinformation` — sale terms/status
- `catalogue` / `cataloguepresence` — appearances in catalogues (e.g. BRAFA, TEFAF)
- `picture` / `tapestrypicture` — attached photos
- `cleaning` — cleaning history

All FKs use `on delete restrict on update restrict`. Collection/table names are lowercase; Directus relation aliases (the O2M side, e.g. `tapestry.ownerships`) are defined in the snapshot, not in the SQL DDL.

**Docker services** (`docker-compose.yaml`): `database` (`imresamu/postgis:17-3.5-bookworm` — not the official `postgis/postgis` image, which has no arm64 build), `cache` (Redis, required by Directus's `CACHE_STORE=redis`), `directus`. Only `directus`'s port is published to the host; `database`/`cache` are reachable only from other containers, so any `psql`/`pg_dump` work goes through `docker compose exec database ...`, not a direct host connection. The `database` healthcheck uses `127.0.0.1`, not `localhost` — the Directus 12 image resolves `localhost` to `::1` where the server isn't listening, so its healthcheck was fixed the same way; keep that in mind if adding new healthchecks.

Postgres `SERIAL` sequences are **not transactional** — a rolled-back bulk insert still advances them. If a seed script fails partway and is rerun, reset sequences first or the fixed IDs used in dependent inserts (e.g. `bprelationship` referencing `businesspartner` by ID) will point at the wrong rows.
