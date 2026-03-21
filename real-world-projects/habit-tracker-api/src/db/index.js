import { DatabaseSync } from "node:sqlite";
import fs   from "fs";
import path from "path";
import { config } from "../config.js";

// Ensure data directory exists before opening the file-based DB
if (config.dbPath !== ":memory:") {
  fs.mkdirSync(path.dirname(path.resolve(config.dbPath)), { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Performance settings — run once on startup
db.exec("PRAGMA journal_mode = WAL");   // better concurrent read performance
db.exec("PRAGMA foreign_keys = ON");    // enforce FK constraints
db.exec("PRAGMA synchronous = NORMAL"); // safe + faster than FULL

// ── Run migrations immediately so tables exist before any import ──────
// Any module that imports `db` gets a fully migrated database.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password     TEXT    NOT NULL,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS habits (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT    NOT NULL,
    description  TEXT    NOT NULL DEFAULT '',
    frequency    TEXT    NOT NULL DEFAULT 'daily'
                         CHECK (frequency IN ('daily', 'weekly')),
    color        TEXT    NOT NULL DEFAULT '#6366f1',
    archived     INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

  CREATE TABLE IF NOT EXISTS completions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id     INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    completed_on TEXT    NOT NULL,
    note         TEXT    NOT NULL DEFAULT '',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (habit_id, completed_on)
  );
  CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON completions(habit_id);
  CREATE INDEX IF NOT EXISTS idx_completions_user_id  ON completions(user_id);
  CREATE INDEX IF NOT EXISTS idx_completions_date     ON completions(completed_on);
`);