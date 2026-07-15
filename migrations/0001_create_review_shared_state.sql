CREATE TABLE IF NOT EXISTS review_shared_state (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  payload TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
