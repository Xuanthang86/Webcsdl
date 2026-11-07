-- Idempotent migration: persistent per-module form configuration.
CREATE TABLE IF NOT EXISTS form_configs (
  module_type TEXT PRIMARY KEY,
  config_json TEXT NOT NULL DEFAULT '{"customFields":[]}',
  updated_by TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
