-- Thumbnails of the tapestry lists read tapestry_files by tapestry.
-- tapestry_files is created by the Directus snapshot, so this index cannot live in the DDL script.
-- Apply after the snapshot. Safe to replay.

CREATE INDEX IF NOT EXISTS tapestry_files_tapestry_id ON tapestry_files (tapestry_id);
