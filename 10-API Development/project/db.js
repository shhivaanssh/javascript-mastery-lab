import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";

export const db = new DatabaseSync(config.dbPath);

// ── Migrations — run on every startup, idempotent ──
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password     TEXT    NOT NULL,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habits (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT    NOT NULL,
    description  TEXT    NOT NULL DEFAULT '',
    frequency    TEXT    NOT NULL DEFAULT 'daily',
    color        TEXT    NOT NULL DEFAULT '#6366f1',
    archived     INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS completions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id     INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    completed_on TEXT    NOT NULL,
    note         TEXT    NOT NULL DEFAULT '',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(habit_id, completed_on)
  );

  CREATE INDEX IF NOT EXISTS idx_habits_user_id       ON habits(user_id);
  CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON completions(habit_id);
  CREATE INDEX IF NOT EXISTS idx_completions_user_id  ON completions(user_id);
  CREATE INDEX IF NOT EXISTS idx_completions_date     ON completions(completed_on);
`);


// ── Query helpers ──

export const stmt = {
  // Users
  createUser:    db.prepare("INSERT INTO users (name, email, password) VALUES (?,?,?)"),
  getUserById:   db.prepare("SELECT id,name,email,created_at FROM users WHERE id = ?"),
  getUserByEmail:db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE"),
  updateUser:    db.prepare("UPDATE users SET name=?,updated_at=datetime('now') WHERE id=?"),

  // Habits
  createHabit:  db.prepare("INSERT INTO habits (user_id,name,description,frequency,color) VALUES (?,?,?,?,?)"),
  getHabit:     db.prepare("SELECT * FROM habits WHERE id=? AND user_id=? AND archived=0"),
  listHabits:   db.prepare("SELECT * FROM habits WHERE user_id=? AND archived=0 ORDER BY created_at ASC"),
  updateHabit:  db.prepare("UPDATE habits SET name=?,description=?,frequency=?,color=?,updated_at=datetime('now') WHERE id=? AND user_id=?"),
  archiveHabit: db.prepare("UPDATE habits SET archived=1,updated_at=datetime('now') WHERE id=? AND user_id=?"),

  // Completions
  logCompletion:   db.prepare("INSERT OR IGNORE INTO completions (habit_id,user_id,completed_on,note) VALUES (?,?,?,?)"),
  removeCompletion:db.prepare("DELETE FROM completions WHERE habit_id=? AND user_id=? AND completed_on=?"),
  getCompletion:   db.prepare("SELECT * FROM completions WHERE habit_id=? AND completed_on=?"),
  listCompletions: db.prepare("SELECT * FROM completions WHERE habit_id=? AND user_id=? ORDER BY completed_on DESC LIMIT ?"),

  // Stats
  completionCount: db.prepare("SELECT COUNT(*) as total FROM completions WHERE habit_id=? AND user_id=?"),
  completionDates: db.prepare(`
    SELECT completed_on FROM completions
    WHERE habit_id=? AND user_id=?
    ORDER BY completed_on DESC
  `),
  recentCompletions: db.prepare(`
    SELECT h.id, h.name, h.color, c.completed_on
    FROM completions c JOIN habits h ON c.habit_id = h.id
    WHERE c.user_id=? ORDER BY c.completed_on DESC LIMIT ?
  `),
  habitCompletionsInRange: db.prepare(`
    SELECT habit_id, COUNT(*) as count
    FROM completions
    WHERE user_id=? AND completed_on BETWEEN ? AND ?
    GROUP BY habit_id
  `),
};


// ── Streak calculation ──

export function calcStreak(dates) {
  // dates: string[] of "YYYY-MM-DD", already sorted DESC
  if (!dates.length) return { current: 0, longest: 0 };

  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  let longest = 0;
  let streak  = 0;
  let prev    = null;

  for (const d of [...dates].reverse()) { // ascending
    if (!prev) { streak = 1; }
    else {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      if (diff === 1) streak++;
      else { longest = Math.max(longest, streak); streak = 1; }
    }
    prev = d;
    longest = Math.max(longest, streak);
  }

  // Current streak only counts if last date was today or yesterday
  const lastDate = dates[0]; // most recent (DESC)
  if (lastDate === today || lastDate === yesterday) {
    // count backwards from last date
    let run = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i-1]) - new Date(dates[i])) / 86400000;
      if (diff === 1) run++;
      else break;
    }
    current = run;
  }

  return { current, longest };
}
