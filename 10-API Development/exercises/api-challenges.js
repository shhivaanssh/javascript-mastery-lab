// All exercises use raw Node.js — no dependencies needed.
// Run: node --experimental-sqlite exercises/api-challenges.js

import http from "http";
import crypto from "crypto";
import { DatabaseSync } from "node:sqlite";


// ── 1. Argument parsing for a mini CLI ──

function parseArgs(argv) {
  const flags = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      flags[key] = !argv[i+1]?.startsWith("--") ? argv[++i] : true;
    } else { pos.push(argv[i]); }
  }
  return { flags, pos };
}

const { flags } = parseArgs(process.argv.slice(2));
const PORT = Number(flags.port ?? 4000);


// ── 2. Request validation without dependencies ──

class ValidationError extends Error {
  constructor(details) {
    super("Validation failed");
    this.status  = 422;
    this.details = details;
  }
}

function validate(body, schema) {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    for (const [ruleName, arg] of Object.entries(rules)) {
      const value = body[field];
      let error = null;

      if (ruleName === "required" && arg && (value == null || value === "")) {
        error = `${field} is required`;
      } else if (value != null && value !== "") {
        if (ruleName === "type"   && typeof value !== arg) error = `${field} must be a ${arg}`;
        if (ruleName === "min"    && value.length < arg)   error = `${field} must be at least ${arg} chars`;
        if (ruleName === "max"    && value.length > arg)   error = `${field} must be at most ${arg} chars`;
        if (ruleName === "email"  && arg && !/^[^@]+@[^@]+\.[^@]+$/.test(value)) error = `${field} must be a valid email`;
        if (ruleName === "oneOf"  && !arg.includes(value)) error = `${field} must be one of: ${arg.join(",")}`;
        if (ruleName === "minNum" && Number(value) < arg)  error = `${field} must be >= ${arg}`;
      }

      if (error) { errors.push({ field, message: error }); break; }
    }
  }
  if (errors.length) throw new ValidationError(errors);
  return body;
}

// Test
try {
  validate({ name: "A", email: "bad" }, {
    name:  { required: true, type: "string", min: 2 },
    email: { required: true, email: true },
  });
} catch (e) {
  console.log("Validation errors:", e.details);
}


// ── 3. JWT from scratch ──

const SECRET = "exercise-secret-key";

function jwtSign(payload, secret, expiresIn = 3600) {
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header = b64({ alg: "HS256", typ: "JWT" });
  const body   = b64({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + expiresIn });
  const sig    = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function jwtVerify(token, secret) {
  const [h, b, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(`${h}.${b}`).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(b, "base64url").toString());
  if (payload.exp < Date.now()/1000) throw new Error("Token expired");
  return payload;
}

const token   = jwtSign({ sub: "user123", role: "admin" }, SECRET);
const decoded = jwtVerify(token, SECRET);
console.log("\nJWT sub:", decoded.sub, "role:", decoded.role);


// ── 4. SQLite CRUD exercise ──

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now'))
  )
`);

const insertTodo = db.prepare("INSERT INTO todos (title) VALUES (?)");
const getTodo    = db.prepare("SELECT * FROM todos WHERE id = ?");
const listTodos  = db.prepare("SELECT * FROM todos ORDER BY created_at DESC");
const updateTodo = db.prepare("UPDATE todos SET done = ? WHERE id = ?");
const deleteTodo = db.prepare("DELETE FROM todos WHERE id = ?");

const { lastInsertRowid: id1 } = insertTodo.run("Buy groceries");
const { lastInsertRowid: id2 } = insertTodo.run("Write tests");
const { lastInsertRowid: id3 } = insertTodo.run("Deploy to prod");

updateTodo.run(1, id1); // mark done

const all = listTodos.all();
console.log("\nTodos:");
all.forEach(t => console.log(`  ${t.done ? "✓" : "○"} [${t.id}] ${t.title}`));
deleteTodo.run(id3);
console.log(`After delete: ${listTodos.all().length} todos`);


// ── 5. Full REST API in raw Node.js ──

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  const body = JSON.stringify({ ok: status < 400, ...data });
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url   = new URL(req.url, `http://localhost`);
  const parts = url.pathname.split("/").filter(Boolean);
  const [resource, id] = parts;

  try {
    if (resource === "todos") {
      if (req.method === "GET"    && !id)  return send(res, 200, { data: listTodos.all() });
      if (req.method === "GET"    &&  id)  {
        const t = getTodo.get(Number(id));
        return t ? send(res, 200, { data: t }) : send(res, 404, { error: "Not found" });
      }
      if (req.method === "POST") {
        const body = await readBody(req);
        validate(body, { title: { required: true, type: "string", min: 1 } });
        const { lastInsertRowid } = insertTodo.run(body.title);
        return send(res, 201, { data: getTodo.get(lastInsertRowid) });
      }
      if (req.method === "PUT"    &&  id)  {
        const body = await readBody(req);
        updateTodo.run(body.done ? 1 : 0, Number(id));
        return send(res, 200, { data: getTodo.get(Number(id)) });
      }
      if (req.method === "DELETE" &&  id)  {
        deleteTodo.run(Number(id));
        res.writeHead(204); res.end(); return;
      }
    }
    send(res, 404, { error: `Cannot ${req.method} ${url.pathname}` });
  } catch (err) {
    if (err instanceof ValidationError) return send(res, 422, { error: err.message, details: err.details });
    send(res, err.status ?? 500, { error: err.message });
  }
});

await new Promise(r => server.listen(PORT, r));
console.log(`\nTodo API on :${PORT}`);

// Make a few test requests
const base = `http://localhost:${PORT}`;

const created = await fetch(`${base}/todos`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Test from exercise" }),
}).then(r => r.json());
console.log("Created:", created.data.title);

const list = await fetch(`${base}/todos`).then(r => r.json());
console.log("Count:", list.data.length);

const invalid = await fetch(`${base}/todos`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "" }),
}).then(r => r.json());
console.log("Validation response:", invalid.details[0].message);

server.close();
console.log("\n✓ All exercises complete");
