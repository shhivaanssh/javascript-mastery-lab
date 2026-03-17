# DevNotes

> Personal developer knowledge base — capture, tag, and search code notes and snippets.

Built as a real-world project inside [javascript-mastery-lab](../../README.md).  
Skills used: Node.js, REST API, SQLite, file system, full-text search, CLI.

---

## Roadmap

| Phase | What | Status |
|-------|------|--------|
| Day 1 | Project scaffold, DB schema, server boots | ✅ Done |
| Day 2 | Full CRUD API + FTS search + tags | 🔜 Next |
| Day 3 | Web UI + CLI (`dn add`, `dn search`) | ⏳ Soon |

---

## Getting started

```bash
cd real-world-projects/devnotes

# Copy env file
cp .env.example .env

# Start the server (Node 22+ required — uses node:sqlite)
node src/server.js

# Dev mode (auto-restarts on file change)
node --watch src/server.js
```

Check it's running:
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "env": "development",
    "uptime": 3
  }
}
```

---

## Project structure

```
devnotes/
├── .env.example        ← copy to .env
├── .gitignore
├── package.json
├── README.md
├── data/               ← created at runtime, gitignored
│   └── devnotes.db
├── bin/
│   └── dn.js           ← CLI (Day 3)
├── public/
│   └── index.html      ← Web UI (Day 3)
└── src/
    ├── config.js        ← env-based config
    ├── db.js            ← SQLite schema + migrations + helpers
    ├── app.js           ← HTTP request handler + router
    └── server.js        ← createServer, listen, graceful shutdown
```

---

## Database schema

```
notes          — id, title, body, language, source, pinned, created_at, updated_at
tags           — id, name (unique)
note_tags      — note_id, tag_id  (many-to-many)
notes_fts      — virtual FTS5 table over title + body (auto-synced via triggers)
```

---

## Day 2 API (coming next)

```
POST   /api/notes              create note
GET    /api/notes              list notes  (?tag=js&lang=js&q=search)
GET    /api/notes/:id          get note
PUT    /api/notes/:id          update note
DELETE /api/notes/:id          delete note
GET    /api/tags               all tags with counts
```

---

## Tech

- **Runtime**: Node.js 22 (zero npm dependencies)
- **Database**: SQLite via `node:sqlite` (built-in)
- **Search**: SQLite FTS5
- **Server**: `node:http`
- **Auth**: none (local-only tool)
