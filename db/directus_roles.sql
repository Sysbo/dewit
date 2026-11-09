-- Directus roles, policies and module bar for the DeWit business module.
-- `schema snapshot` does not export these, so they are versioned here. Safe to replay.
--
-- Roles have no permission on the domain collections: all business data goes through
-- the /dewit endpoint, which applies the access rules. The role ids are referenced by
-- extensions/directus-extension-dewit/src/shared/roles.ts.
-- The only permissions granted are on directus_files, needed for native upload and thumbnails.

BEGIN;

INSERT INTO directus_folders (id, name)
VALUES ('daae1fe9-3867-464a-9c93-9b56b2a8d59a', 'Tapestries')
ON CONFLICT (id) DO NOTHING;

INSERT INTO directus_roles (id, name, icon, description) VALUES
  ('a1c4e2f0-6b1d-4c3a-8f21-3d5e7a9b0c01', 'Manager', 'manage_accounts', 'Full management of the DeWit inventory, including sales'),
  ('a1c4e2f0-6b1d-4c3a-8f21-3d5e7a9b0c02', 'Standard', 'person', 'DeWit inventory consultation, internal location updates and artists')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;

INSERT INTO directus_policies (id, name, icon, description, enforce_tfa, admin_access, app_access) VALUES
  ('b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d11', 'DeWit Manager', 'manage_accounts', 'Data Studio access and tapestry picture upload', false, false, true),
  ('b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d12', 'DeWit Standard', 'person', 'Data Studio access and tapestry picture consultation', false, false, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, app_access = true, admin_access = false;

INSERT INTO directus_access (id, role, policy, sort) VALUES
  ('c3e6a4b2-8d3f-4e5c-ab43-5f7a9c1d2e21', 'a1c4e2f0-6b1d-4c3a-8f21-3d5e7a9b0c01', 'b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d11', 1),
  ('c3e6a4b2-8d3f-4e5c-ab43-5f7a9c1d2e22', 'a1c4e2f0-6b1d-4c3a-8f21-3d5e7a9b0c02', 'b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d12', 1)
ON CONFLICT (id) DO NOTHING;

DELETE FROM directus_permissions
 WHERE policy IN ('b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d11', 'b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d12');

INSERT INTO directus_permissions (collection, action, permissions, validation, presets, fields, policy) VALUES
  ('directus_files', 'read', '{"folder":{"_eq":"daae1fe9-3867-464a-9c93-9b56b2a8d59a"}}', NULL, NULL, '*', 'b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d11'),
  ('directus_files', 'create', NULL, NULL, '{"folder":"daae1fe9-3867-464a-9c93-9b56b2a8d59a"}', '*', 'b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d11'),
  ('directus_files', 'read', '{"folder":{"_eq":"daae1fe9-3867-464a-9c93-9b56b2a8d59a"}}', NULL, NULL, '*', 'b2d5f3a1-7c2e-4d4b-9a32-4e6f8b0c1d12');

-- The module bar is global: generic modules are hidden for everyone.
-- Administrators reach them from the Administration section of the DeWit module menu.
UPDATE directus_settings SET module_bar = '[
  {"id": "dewit", "type": "module", "enabled": true},
  {"id": "content", "type": "module", "enabled": false},
  {"id": "visual", "type": "module", "enabled": false},
  {"id": "users", "type": "module", "enabled": false},
  {"id": "files", "type": "module", "enabled": false},
  {"id": "insights", "type": "module", "enabled": false},
  {"id": "flows", "type": "module", "enabled": true},
  {"id": "settings", "type": "module", "locked": true, "enabled": true}
]'::json;

COMMIT;
