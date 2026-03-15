// ═══════════════════════════════════════════
// DATABASE — SQLite (Node 22 built-in)
// ═══════════════════════════════════════════
//
// SQLite:     file-based, zero config, perfect for dev + small apps
// PostgreSQL: production-grade, concurrent writes, full SQL
// MongoDB:    document store, flexible schema, JSON-native
//
// Migration path: start with SQLite, switch to PostgreSQL by changing
// the driver and connection string — SQL queries are mostly the same.

import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Opening a database ──

const db = new DatabaseSync(":memory:");          // in-memory (tests)
const db2 = new DatabaseSync("./data/app.db");   // file-based (production)

// DatabaseSync is synchronous — no await needed
// Use it for simple apps; for high concurrency, use better-sqlite3 or pg


// ── Schema and migrations ──

// Always run migrations on startup — idempotent CREATE TABLE IF NOT EXISTS
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'user',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL DEFAULT '',
    published  INTEGER NOT NULL DEFAULT 0,  -- SQLite has no BOOLEAN
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
`);


// ── Prepared statements ──
// Always use prepared statements — prevents SQL injection.

const insertUser = db.prepare(`
  INSERT INTO users (name, email, password) VALUES (?, ?, ?)
`);

const getUserById    = db.prepare("SELECT * FROM users WHERE id = ?");
const getUserByEmail = db.prepare("SELECT * FROM users WHERE email = ?");

const updateUser = db.prepare(`
  UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?
`);

const deleteUser = db.prepare("DELETE FROM users WHERE id = ?");


// ── CRUD operations ──

function createUser(name, email, password) {
  const result = insertUser.run(name, email, password);
  return { id: result.lastInsertRowid, name, email };
}

function getUser(id) {
  return getUserById.get(id) ?? null; // get() returns first row or undefined
}

function listUsers({ page = 1, limit = 20 } = {}) {
  const stmt = db.prepare("SELECT id, name, email, created_at FROM users LIMIT ? OFFSET ?");
  return stmt.all(limit, (page - 1) * limit); // all() returns array
}

function countUsers() {
  const row = db.prepare("SELECT COUNT(*) as total FROM users").get();
  return row.total;
}


// ── Transactions ──
// Use transactions when multiple writes must succeed or fail together.

function transferCredits(fromId, toId, amount) {
  const debit  = db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?");
  const credit = db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?");

  // DatabaseSync transaction
  const transfer = db.transaction((from, to, amt) => {
    const result = debit.run(amt, from, amt);
    if (result.changes === 0) throw new Error("Insufficient funds");
    credit.run(amt, to);
    return true;
  });

  return transfer(fromId, toId, amount); // atomic — if either throws, both roll back
}


// ── Query builder pattern (lightweight, no ORM) ──

class QueryBuilder {
  #table; #conditions = []; #params = []; #order; #limitVal; #offsetVal;

  constructor(table) { this.#table = table; }

  where(sql, ...params) {
    this.#conditions.push(sql);
    this.#params.push(...params);
    return this;
  }

  orderBy(col, dir = "ASC") { this.#order = `${col} ${dir}`; return this; }
  limit(n)  { this.#limitVal  = n; return this; }
  offset(n) { this.#offsetVal = n; return this; }

  build() {
    let sql = `SELECT * FROM ${this.#table}`;
    if (this.#conditions.length) sql += ` WHERE ${this.#conditions.join(" AND ")}`;
    if (this.#order)             sql += ` ORDER BY ${this.#order}`;
    if (this.#limitVal != null)  sql += ` LIMIT ${this.#limitVal}`;
    if (this.#offsetVal != null) sql += ` OFFSET ${this.#offsetVal}`;
    return { sql, params: this.#params };
  }

  run(db) {
    const { sql, params } = this.build();
    return db.prepare(sql).all(...params);
  }
}

const activeAdmins = new QueryBuilder("users")
  .where("role = ?", "admin")
  .where("active = ?", 1)
  .orderBy("created_at", "DESC")
  .limit(10)
  .run(db);


// ═══════════════════════════════════════════
// CONFIG MANAGEMENT
// ═══════════════════════════════════════════

// Config lives in environment variables, not in code.
// Different values per environment: dev, test, production.

// config.js — centralised config module

const config = {
  env:        process.env.NODE_ENV   ?? "development",
  port:       Number(process.env.PORT ?? 3000),
  dbPath:     process.env.DB_PATH    ?? "./data/app.db",
  jwtSecret:  process.env.JWT_SECRET ?? (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    console.warn("⚠  Using default JWT secret — set JWT_SECRET in .env");
    return "dev-secret-not-for-production";
  })(),
  jwtExpiry:  Number(process.env.JWT_EXPIRY_SECONDS ?? 604800), // 7 days
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  isDev:      (process.env.NODE_ENV ?? "development") === "development",
  isProd:     process.env.NODE_ENV === "production",
  isTest:     process.env.NODE_ENV === "test",
};

// Validate required config at startup
function requireConfig(...keys) {
  const missing = keys.filter(k => !config[k]);
  if (missing.length) {
    throw new Error(`Missing required config: ${missing.join(", ")}`);
  }
}

if (config.isProd) {
  requireConfig("jwtSecret");
}


// .env.example (commit this, not .env)
//
// NODE_ENV=development
// PORT=3000
// DB_PATH=./data/app.db
// JWT_SECRET=your-super-secret-key-min-32-chars
// JWT_EXPIRY_SECONDS=604800
// CORS_ORIGIN=http://localhost:5173


// ── PostgreSQL migration (same SQL, different driver) ──
//
// When you outgrow SQLite, switch to PostgreSQL:
//
// import { Pool } from "pg";
//
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
// });
//
// async function query(sql, params) {
//   const { rows } = await pool.query(sql, params);
//   return rows;
// }
//
// Differences from SQLite:
//   - Async (Promise-based) instead of sync
//   - Params use $1, $2, $3 instead of ?
//   - BOOLEAN is a real type (not 0/1)
//   - SERIAL or GENERATED ALWAYS AS IDENTITY instead of AUTOINCREMENT
//   - datetime('now') → NOW()

export { db, config };
