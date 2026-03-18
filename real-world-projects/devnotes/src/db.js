import { DatabaseSync } from "node:sqlite";
import fs   from "fs";
import path from "path";
import { config } from "./config.js";

// Ensure data directory exists before opening the DB
if (config.dbPath !== ":memory:") {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// ── Migrations ──────────────────────────────────────
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  -- Notes table
  CREATE TABLE IF NOT EXISTS notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    body        TEXT    NOT NULL DEFAULT '',
    language    TEXT    NOT NULL DEFAULT '',
    source      TEXT    NOT NULL DEFAULT '',
    pinned      INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Tags table
  CREATE TABLE IF NOT EXISTS tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE COLLATE NOCASE
  );

  -- Note ↔ Tag join table
  CREATE TABLE IF NOT EXISTS note_tags (
    note_id  INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
  );

  -- Full-text search index over title + body
  CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title,
    body,
    content='notes',
    content_rowid='id'
  );

  -- Keep FTS in sync with notes table
  CREATE TRIGGER IF NOT EXISTS notes_fts_insert
    AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;

  CREATE TRIGGER IF NOT EXISTS notes_fts_update
    AFTER UPDATE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, body)
        VALUES ('delete', old.id, old.title, old.body);
      INSERT INTO notes_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;

  CREATE TRIGGER IF NOT EXISTS notes_fts_delete
    AFTER DELETE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, body)
        VALUES ('delete', old.id, old.title, old.body);
    END;

  CREATE INDEX IF NOT EXISTS idx_notes_language  ON notes(language);
  CREATE INDEX IF NOT EXISTS idx_notes_pinned    ON notes(pinned);
  CREATE INDEX IF NOT EXISTS idx_note_tags_tag   ON note_tags(tag_id);
`);

// ── Prepared statements ──────────────────────────────

export const stmt = {
  // Notes
  insertNote:  db.prepare(`
    INSERT INTO notes (title, body, language, source, pinned)
    VALUES (?, ?, ?, ?, ?)
  `),
  getNoteById: db.prepare("SELECT * FROM notes WHERE id = ?"),
  updateNote:  db.prepare(`
    UPDATE notes
    SET title=?, body=?, language=?, source=?, pinned=?,
        updated_at=datetime('now')
    WHERE id=?
  `),
  deleteNote:  db.prepare("DELETE FROM notes WHERE id = ?"),

  // Tags
  insertTag:      db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)"),
  getTagByName:   db.prepare("SELECT * FROM tags WHERE name = ? COLLATE NOCASE"),
  listTags:       db.prepare(`
    SELECT t.id, t.name, COUNT(nt.note_id) as count
    FROM tags t
    LEFT JOIN note_tags nt ON nt.tag_id = t.id
    GROUP BY t.id
    ORDER BY count DESC, t.name ASC
  `),

  // Note ↔ Tag
  linkTag:        db.prepare("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?,?)"),
  unlinkAllTags:  db.prepare("DELETE FROM note_tags WHERE note_id = ?"),
  getNoteTags:    db.prepare(`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = ?
    ORDER BY t.name ASC
  `),
};


// ── Helpers ──────────────────────────────────────────

// Upsert a list of tag names and return their IDs
export function upsertTags(names) {
  return names.map(name => {
    const clean = name.trim().toLowerCase();
    stmt.insertTag.run(clean);
    return stmt.getTagByName.get(clean).id;
  });
}

// Attach tags to a note (replaces all existing tags)
export function setNoteTags(noteId, tagNames) {
  stmt.unlinkAllTags.run(noteId);
  if (!tagNames.length) return;
  const ids = upsertTags(tagNames);
  ids.forEach(tagId => stmt.linkTag.run(noteId, tagId));
}

// Attach tag names array to a note row
export function withTags(note) {
  if (!note) return null;
  const tags = stmt.getNoteTags.all(note.id).map(r => r.name);
  return { ...note, tags };
}

// Dynamic query — filter by search, tag, language, pinned
export function queryNotes({ q, tag, lang, pinned, page = 1, limit = 20 } = {}) {
  limit = Math.min(Number(limit) || 20, 100);
  page  = Math.max(Number(page)  || 1,  1);

  const params = [];
  const joins  = [];
  const where  = ["1=1"];

  if (q) {
    // Sanitize FTS5 special characters, then do a prefix match
    const safe = q.replace(/["'()*\[\]^]/g, " ").trim();
    if (safe) {
      where.push("n.id IN (SELECT rowid FROM notes_fts WHERE notes_fts MATCH ?)");
      params.push(safe + "*");
    }
  }

  if (tag) {
    joins.push("JOIN note_tags nt ON nt.note_id = n.id JOIN tags t ON t.id = nt.tag_id");
    where.push("t.name = ? COLLATE NOCASE");
    params.push(tag);
  }

  if (lang) {
    where.push("n.language = ? COLLATE NOCASE");
    params.push(lang);
  }

  if (pinned === "1" || pinned === true) {
    where.push("n.pinned = 1");
  }

  const j = joins.join(" ");
  const w = `WHERE ${where.join(" AND ")}`;

  const total = db.prepare(
    `SELECT COUNT(DISTINCT n.id) as total FROM notes n ${j} ${w}`
  ).get(...params).total;

  const rows = db.prepare(`
    SELECT DISTINCT n.* FROM notes n ${j} ${w}
    ORDER BY n.pinned DESC, n.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, (page - 1) * limit);

  return { rows, total, page, limit, pages: Math.ceil(total / limit) };
}
