-- Idempotent repair for environments where the initial D1 import omitted system_config.
CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  portal_name TEXT NOT NULL,
  governing_agency TEXT NOT NULL,
  contact_address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  city_area TEXT DEFAULT 'Thành phố Đà Nẵng',
  allow_public_submission INTEGER DEFAULT 1,
  require_approval INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
