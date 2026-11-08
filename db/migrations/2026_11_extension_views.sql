-- Aligns an existing database with the business views served by the
-- directus-extension-dewit extension (DeWit_ViewsDescription.xlsx / DeWit_Draft_Views.pdf).
-- Apply once, on a database that still has the previous schema (e.g. right after
-- restoring a dump from backups/). Then restart Directus and re-export the snapshot.

BEGIN;

-- 1. Data consistency: at most one active row per tapestry, the most recent one wins.
UPDATE tapestrylocation tl
   SET active = false, "out" = COALESCE("out", CURRENT_DATE)
 WHERE active
   AND id <> (SELECT max(x.id) FROM tapestrylocation x WHERE x.tapestryid = tl.tapestryid AND x.active);

UPDATE ownership o
   SET active = false, dateend = COALESCE(dateend, CURRENT_DATE)
 WHERE active
   AND id <> (SELECT max(x.id) FROM ownership x WHERE x.tapestryid = o.tapestryid AND x.active);

UPDATE salesinformation s
   SET active = false
 WHERE active
   AND id <> (SELECT max(x.id) FROM salesinformation x WHERE x.tapestryid = s.tapestryid AND x.active);

-- salesinformation is the reference for what is currently for sale.
UPDATE tapestry t
   SET forsale = EXISTS (SELECT 1 FROM salesinformation s WHERE s.tapestryid = t.id AND s.active);

-- 2. Tapestry: optional values and types requested by the views.
ALTER TABLE tapestry
  ALTER COLUMN artist DROP NOT NULL,
  ALTER COLUMN orientation DROP NOT NULL,
  ALTER COLUMN fragment DROP NOT NULL,
  ALTER COLUMN velcro DROP NOT NULL,
  ALTER COLUMN lining DROP NOT NULL,
  ALTER COLUMN definitivesize DROP NOT NULL,
  ALTER COLUMN label DROP NOT NULL,
  ALTER COLUMN label TYPE text USING NULL,
  ALTER COLUMN century TYPE text USING century::text,
  ALTER COLUMN conservation TYPE text USING conservation::text,
  ALTER COLUMN edition TYPE integer USING (CASE WHEN edition ~ '^[0-9]+$' THEN edition::integer END),
  ALTER COLUMN height TYPE numeric(8,2) USING round(height::numeric, 2),
  ALTER COLUMN width TYPE numeric(8,2) USING round(width::numeric, 2),
  ALTER COLUMN surface TYPE numeric(10,2) USING round(surface::numeric, 2),
  ALTER COLUMN forsale SET DEFAULT false,
  ALTER COLUMN privatecollection SET DEFAULT false;

CREATE UNIQUE INDEX tapestry_inventorynumber_unique ON tapestry (inventorynumber);

-- 3. Location: an external business partner has no room/area.
ALTER TABLE tapestrylocation ALTER COLUMN locationid DROP NOT NULL;

-- 4. Catalogue: identified by name and year.
ALTER TABLE catalogue
  ADD COLUMN year integer,
  ALTER COLUMN datestart DROP NOT NULL,
  ALTER COLUMN dateend DROP NOT NULL;
UPDATE catalogue SET year = EXTRACT(YEAR FROM COALESCE(datestart, dateend, CURRENT_DATE))::integer;
ALTER TABLE catalogue ALTER COLUMN year SET NOT NULL;

-- 5. Sales: prices are whole amounts.
ALTER TABLE salesinformation
  ALTER COLUMN minprice TYPE integer USING round(minprice)::integer,
  ALTER COLUMN transactionprice TYPE integer USING round(transactionprice)::integer;

-- 6. One active row per tapestry, enforced by the database.
CREATE UNIQUE INDEX tapestrylocation_one_active ON tapestrylocation (tapestryid) WHERE active;
CREATE UNIQUE INDEX ownership_one_active ON ownership (tapestryid) WHERE active;
CREATE UNIQUE INDEX salesinformation_one_active ON salesinformation (tapestryid) WHERE active;

-- 7. Relation types from the specification; DeWit becomes the SELF partner.
INSERT INTO relationtype (name)
SELECT v.name FROM (VALUES ('Self'), ('Museum'), ('Other')) AS v(name)
 WHERE NOT EXISTS (SELECT 1 FROM relationtype r WHERE lower(r.name) = lower(v.name));

DELETE FROM bprelationship b
 USING relationtype r, businesspartner p
 WHERE b.relationtypeid = r.id AND b.businesspartnerid = p.id
   AND r.name = 'N/A' AND p.name = 'Manufacture DeWit';

INSERT INTO bprelationship (relationtypeid, businesspartnerid)
SELECT r.id, p.id
  FROM relationtype r, businesspartner p
 WHERE lower(r.name) = 'self' AND p.name = 'Manufacture DeWit'
   AND NOT EXISTS (
     SELECT 1 FROM bprelationship b JOIN relationtype t ON t.id = b.relationtypeid WHERE lower(t.name) = 'self'
   );

-- 8. Directus metadata for the changed columns.
UPDATE directus_fields
   SET interface = 'input', special = NULL, options = NULL, display = NULL, display_options = NULL
 WHERE collection = 'tapestry' AND field = 'label';

UPDATE directus_fields
   SET required = false
 WHERE (collection = 'tapestry' AND field IN ('artist', 'orientation', 'fragment', 'velcro', 'lining', 'definitivesize', 'label'))
    OR (collection = 'tapestrylocation' AND field = 'locationid')
    OR (collection = 'catalogue' AND field IN ('datestart', 'dateend'));

INSERT INTO directus_fields (collection, field, interface, width, required, searchable)
VALUES ('catalogue', 'year', 'input', 'half', true, true);

UPDATE directus_collections SET display_template = '{{name}} {{year}}' WHERE collection = 'catalogue';

COMMIT;
