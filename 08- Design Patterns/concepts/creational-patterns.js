// Creational patterns deal with object creation.
// They abstract the instantiation process, making systems
// independent of how objects are created, composed, and represented.


// ════════════════════════════════════════════════════════
// SINGLETON
// Ensure a class has only one instance and provide a global
// access point to it.
// ════════════════════════════════════════════════════════

class AppConfig {
  static #instance = null;

  #settings = {
    theme:    "dark",
    language: "en",
    debug:    false,
  };

  // Private constructor — prevents direct new AppConfig()
  constructor() {
    if (AppConfig.#instance) {
      throw new Error("Use AppConfig.getInstance()");
    }
  }

  static getInstance() {
    if (!AppConfig.#instance) {
      AppConfig.#instance = new AppConfig();
    }
    return AppConfig.#instance;
  }

  get(key)        { return this.#settings[key]; }
  set(key, value) { this.#settings[key] = value; return this; }
  getAll()        { return { ...this.#settings }; }
}

const config1 = AppConfig.getInstance();
const config2 = AppConfig.getInstance();
console.log(config1 === config2); // true — same instance

config1.set("theme", "light");
console.log(config2.get("theme")); // "light" — same object

// Module-level singleton (simpler, idiomatic in ESM)
// Just export a single instance from a module — the module cache
// ensures it's only created once across all imports.
export const config = AppConfig.getInstance();


// ════════════════════════════════════════════════════════
// FACTORY METHOD
// Define an interface for creating objects, but let subclasses
// or a factory function decide which class to instantiate.
// ════════════════════════════════════════════════════════

// Simple factory function
function createNotification(type, message) {
  const base = {
    message,
    createdAt: new Date().toISOString(),
    read: false,
    markRead() { this.read = true; return this; },
  };

  switch (type) {
    case "success": return { ...base, type, icon: "✓", color: "green" };
    case "error":   return { ...base, type, icon: "✕", color: "red",   urgent: true };
    case "warning": return { ...base, type, icon: "!", color: "orange" };
    case "info":    return { ...base, type, icon: "i", color: "blue"   };
    default: throw new TypeError(`Unknown notification type: ${type}`);
  }
}

const n = createNotification("success", "File saved");
console.log(n.icon); // "✓"


// Factory class — delegates creation to subclasses
class Logger {
  log(msg)   { throw new Error("implement log()"); }
  info(msg)  { this.log(`[INFO]  ${msg}`); }
  warn(msg)  { this.log(`[WARN]  ${msg}`); }
  error(msg) { this.log(`[ERROR] ${msg}`); }

  // Factory method — override to return different logger types
  static create(type = "console") {
    switch (type) {
      case "console": return new ConsoleLogger();
      case "file":    return new FileLogger();
      case "null":    return new NullLogger();
      default:        throw new TypeError(`Unknown logger: ${type}`);
    }
  }
}

class ConsoleLogger extends Logger {
  log(msg) { console.log(msg); }
}

class FileLogger extends Logger {
  #lines = [];
  log(msg) { this.#lines.push(msg); }
  dump()   { return this.#lines.join("\n"); }
}

class NullLogger extends Logger {
  log() {} // discard everything — useful in tests
}

const logger = Logger.create("console");
logger.info("App started");


// ════════════════════════════════════════════════════════
// ABSTRACT FACTORY
// Create families of related objects without specifying
// their concrete classes.
// ════════════════════════════════════════════════════════

// UI component factory — different implementations per theme
function createUIFactory(theme) {
  const themes = {
    light: {
      button:  (label) => ({ type: "button", label, bg: "#fff", color: "#000", border: "1px solid #ccc" }),
      input:   (placeholder) => ({ type: "input", placeholder, bg: "#fff", border: "1px solid #ddd" }),
      card:    (content) => ({ type: "card", content, bg: "#fff", shadow: "0 1px 3px rgba(0,0,0,0.1)" }),
    },
    dark: {
      button:  (label) => ({ type: "button", label, bg: "#333", color: "#fff", border: "1px solid #555" }),
      input:   (placeholder) => ({ type: "input", placeholder, bg: "#222", border: "1px solid #444" }),
      card:    (content) => ({ type: "card", content, bg: "#1a1a1a", shadow: "0 1px 3px rgba(0,0,0,0.5)" }),
    },
  };

  if (!themes[theme]) throw new TypeError(`Unknown theme: ${theme}`);
  return themes[theme];
}

const ui = createUIFactory("dark");
const btn = ui.button("Submit");
const inp = ui.input("Enter email...");


// ════════════════════════════════════════════════════════
// BUILDER
// Construct complex objects step by step.
// Separate construction from representation.
// ════════════════════════════════════════════════════════

class QueryBuilder {
  #table  = "";
  #fields = ["*"];
  #conditions = [];
  #orderBy = null;
  #limit  = null;
  #offset = null;
  #joins  = [];

  from(table)         { this.#table = table; return this; }
  select(...fields)   { this.#fields = fields; return this; }
  where(condition)    { this.#conditions.push(condition); return this; }
  orderBy(field, dir = "ASC") { this.#orderBy = `${field} ${dir}`; return this; }
  limit(n)            { this.#limit = n; return this; }
  offset(n)           { this.#offset = n; return this; }
  join(table, on)     { this.#joins.push(`JOIN ${table} ON ${on}`); return this; }
  leftJoin(table, on) { this.#joins.push(`LEFT JOIN ${table} ON ${on}`); return this; }

  build() {
    if (!this.#table) throw new Error("Table is required");

    let sql = `SELECT ${this.#fields.join(", ")} FROM ${this.#table}`;
    if (this.#joins.length)      sql += ` ${this.#joins.join(" ")}`;
    if (this.#conditions.length) sql += ` WHERE ${this.#conditions.join(" AND ")}`;
    if (this.#orderBy)           sql += ` ORDER BY ${this.#orderBy}`;
    if (this.#limit !== null)    sql += ` LIMIT ${this.#limit}`;
    if (this.#offset !== null)   sql += ` OFFSET ${this.#offset}`;

    return sql;
  }
}

const query = new QueryBuilder()
  .from("users")
  .select("id", "name", "email")
  .join("orders", "orders.user_id = users.id")
  .where("users.active = true")
  .where("orders.total > 100")
  .orderBy("users.name")
  .limit(20)
  .offset(40)
  .build();

console.log(query);
// SELECT id, name, email FROM users
// JOIN orders ON orders.user_id = users.id
// WHERE users.active = true AND orders.total > 100
// ORDER BY users.name ASC LIMIT 20 OFFSET 40


// Builder with director — reuse common build steps
class HttpRequestBuilder {
  #config = { headers: {}, params: {} };

  url(url)              { this.#config.url = url; return this; }
  method(m)             { this.#config.method = m; return this; }
  header(key, value)    { this.#config.headers[key] = value; return this; }
  param(key, value)     { this.#config.params[key] = value; return this; }
  body(data)            { this.#config.body = JSON.stringify(data); return this; }
  timeout(ms)           { this.#config.timeout = ms; return this; }
  auth(token)           { return this.header("Authorization", `Bearer ${token}`); }
  json()                { return this.header("Content-Type", "application/json"); }

  build() {
    const { url, params, ...options } = this.#config;
    const qs = new URLSearchParams(params).toString();
    return { url: qs ? `${url}?${qs}` : url, options };
  }
}

const request = new HttpRequestBuilder()
  .url("/api/users")
  .method("POST")
  .auth("my-token")
  .json()
  .body({ name: "Alex", email: "alex@example.com" })
  .timeout(5000)
  .build();
