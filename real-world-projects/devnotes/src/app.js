import http   from "http";
import crypto from "crypto";
import { config } from "./config.js";
import { db, stmt, setNoteTags, withTags, queryNotes } from "./db.js";


// ════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 500_000) req.destroy(new Error("Payload too large"));
    });
    req.on("end", () => {
      try   { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(Object.assign(new Error("Invalid JSON body"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

export function send(res, status, data) {
  const body = JSON.stringify({ ok: status < 400, ...data }, null, config.isDev ? 2 : 0);
  res.writeHead(status, {
    "Content-Type":                "application/json",
    "Content-Length":              Buffer.byteLength(body),
    "X-Request-ID":                res._reqId ?? "",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function applyCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age",       "86400");
}


// ════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════

class ValidationError extends Error {
  constructor(details) {
    super("Validation failed");
    this.status  = 422;
    this.code    = "VALIDATION_ERROR";
    this.details = Array.isArray(details) ? details : [{ field: "body", message: details }];
  }
}

function validate(body, schema) {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const val = body[field];
    for (const rule of rules) {
      const err = rule(val, field);
      if (err) { errors.push({ field, message: err }); break; }
    }
  }
  if (errors.length) throw new ValidationError(errors);
}

// Rule factories
const required = () => (v, f) =>
  (v == null || v === "") ? `${f} is required` : null;

const isString = (min = 0, max = 500) => (v, f) => {
  if (v == null || v === "") return null; // optional — pair with required() if needed
  if (typeof v !== "string") return `${f} must be a string`;
  const len = v.trim().length;
  if (len < min) return `${f} must be at least ${min} character${min > 1 ? "s" : ""}`;
  if (len > max) return `${f} must be at most ${max} characters`;
  return null;
};

const isArray = () => (v, f) =>
  v != null && !Array.isArray(v) ? `${f} must be an array` : null;

const isBoolean = () => (v, f) =>
  v != null && typeof v !== "boolean" ? `${f} must be a boolean` : null;


// ════════════════════════════════════════════
// ROUTE HANDLERS
// ════════════════════════════════════════════

// POST /api/notes
async function createNote(req, res) {
  const body = await readBody(req);

  validate(body, {
    title:    [required(), isString(1, 500)],
    body:     [isString(0, 100_000)],
    language: [isString(0, 50)],
    source:   [isString(0, 500)],
    pinned:   [isBoolean()],
    tags:     [isArray()],
  });

  const result = stmt.insertNote.run(
    body.title.trim(),
    (body.body     ?? "").trim(),
    (body.language ?? "").trim().toLowerCase(),
    (body.source   ?? "").trim(),
    body.pinned ? 1 : 0
  );

  const id = result.lastInsertRowid;
  setNoteTags(id, body.tags ?? []);

  const note = withTags(stmt.getNoteById.get(id));
  send(res, 201, { data: note });
}


// GET /api/notes
function listNotes(req, res) {
  const url    = new URL(req.url, "http://localhost");
  const params = {
    q:      url.searchParams.get("q")      ?? "",
    tag:    url.searchParams.get("tag")    ?? "",
    lang:   url.searchParams.get("lang")   ?? "",
    pinned: url.searchParams.get("pinned") ?? "",
    page:   url.searchParams.get("page")   ?? 1,
    limit:  url.searchParams.get("limit")  ?? 20,
  };

  const { rows, total, page, limit, pages } = queryNotes({
    q:      params.q      || undefined,
    tag:    params.tag    || undefined,
    lang:   params.lang   || undefined,
    pinned: params.pinned || undefined,
    page:   params.page,
    limit:  params.limit,
  });

  const data = rows.map(withTags);
  send(res, 200, { data, meta: { total, page, limit, pages } });
}


// GET /api/notes/:id
function getNote(req, res, id) {
  const note = withTags(stmt.getNoteById.get(id));
  if (!note) throw Object.assign(new Error("Note not found"), { status: 404 });
  send(res, 200, { data: note });
}


// PUT /api/notes/:id
async function updateNote(req, res, id) {
  const existing = stmt.getNoteById.get(id);
  if (!existing) throw Object.assign(new Error("Note not found"), { status: 404 });

  const body = await readBody(req);

  validate(body, {
    title:    [isString(1, 500)],
    body:     [isString(0, 100_000)],
    language: [isString(0, 50)],
    source:   [isString(0, 500)],
    pinned:   [isBoolean()],
    tags:     [isArray()],
  });

  stmt.updateNote.run(
    (body.title    !== undefined ? body.title.trim()                    : existing.title),
    (body.body     !== undefined ? body.body.trim()                     : existing.body),
    (body.language !== undefined ? body.language.trim().toLowerCase()   : existing.language),
    (body.source   !== undefined ? body.source.trim()                   : existing.source),
    (body.pinned   !== undefined ? (body.pinned ? 1 : 0)                : existing.pinned),
    id
  );

  if (body.tags !== undefined) {
    setNoteTags(id, body.tags);
  }

  send(res, 200, { data: withTags(stmt.getNoteById.get(id)) });
}


// DELETE /api/notes/:id
function deleteNote(req, res, id) {
  const existing = stmt.getNoteById.get(id);
  if (!existing) throw Object.assign(new Error("Note not found"), { status: 404 });
  stmt.deleteNote.run(id);
  res.writeHead(204); res.end();
}


// GET /api/tags
function listTags(req, res) {
  const tags = stmt.listTags.all();
  send(res, 200, { data: tags });
}


// ════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════

export async function handleRequest(req, res) {
  res._reqId = crypto.randomUUID().slice(0, 8);
  applyCORS(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204); res.end(); return;
  }

  const url    = new URL(req.url, "http://localhost");
  const path   = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method;

  console.log(`[${res._reqId}] ${method} ${path}`);

  // Parse /api/notes[/:id]
  const notesMatch = path.match(/^\/api\/notes(?:\/(\d+))?$/);
  const noteId     = notesMatch ? (notesMatch[1] ? Number(notesMatch[1]) : null) : null;

  try {
    // ── Health ───────────────────────────────────
    if (path === "/health" && method === "GET") {
      return send(res, 200, {
        data: { status: "ok", version: "0.1.0", env: config.env, uptime: Math.round(process.uptime()) },
      });
    }

    // ── Notes collection ─────────────────────────
    if (notesMatch && noteId === null) {
      if (method === "GET")  return listNotes(req, res);
      if (method === "POST") return await createNote(req, res);
    }

    // ── Single note ───────────────────────────────
    if (notesMatch && noteId !== null) {
      if (method === "GET")    return getNote(req, res, noteId);
      if (method === "PUT")    return await updateNote(req, res, noteId);
      if (method === "PATCH")  return await updateNote(req, res, noteId);
      if (method === "DELETE") return deleteNote(req, res, noteId);
    }

    // ── Tags ──────────────────────────────────────
    if (path === "/api/tags" && method === "GET") {
      return listTags(req, res);
    }

    // ── 404 ───────────────────────────────────────
    send(res, 404, { error: `Cannot ${method} ${path}` });

  } catch (err) {
    const status = err.status ?? 500;
    if (status >= 500) {
      console.error(`[${res._reqId}] ERROR:`, err.message);
      if (config.isDev) console.error(err.stack);
    }

    if (err instanceof ValidationError) {
      return send(res, 422, { error: err.message, code: err.code, details: err.details });
    }

    send(res, status, {
      error: config.isProd && status >= 500 ? "Internal server error" : err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }
}
