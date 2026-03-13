// Module 08 Mini Project — Pattern Library
// Each pattern is demonstrated with a realistic use case.
// Run: node index.js

function section(title) {
  console.log(`\n${"═".repeat(56)}`);
  console.log(`  ${title}`);
  console.log("═".repeat(56));
}


// ════════════════════════════════════════════════════════
// SINGLETON — Application Logger
// Real use: one logger instance shared across the whole app
// ════════════════════════════════════════════════════════
section("SINGLETON — Application Logger");

class Logger {
  static #instance = null;
  #logs = [];
  #level;

  constructor(level = "info") {
    if (Logger.#instance) throw new Error("Use Logger.getInstance()");
    this.#level = level;
  }

  static getInstance(level) {
    if (!Logger.#instance) Logger.#instance = new Logger(level);
    return Logger.#instance;
  }

  #write(level, message) {
    const entry = { level, message, ts: new Date().toISOString() };
    this.#logs.push(entry);
    const icon = { debug: "○", info: "●", warn: "▲", error: "✕" }[level] ?? "•";
    console.log(`  ${icon} [${level.toUpperCase()}] ${message}`);
  }

  debug(msg) { if (this.#level === "debug") this.#write("debug", msg); }
  info(msg)  { this.#write("info",  msg); }
  warn(msg)  { this.#write("warn",  msg); }
  error(msg) { this.#write("error", msg); }

  getLogs(level) {
    return level ? this.#logs.filter(l => l.level === level) : [...this.#logs];
  }
}

const log  = Logger.getInstance("info");
const log2 = Logger.getInstance(); // same instance
console.log(`  Same instance: ${log === log2}`);

log.info("Application started");
log.warn("Config file missing — using defaults");
log.error("Database connection failed");
console.log(`  Total logs: ${log.getLogs().length}`);


// ════════════════════════════════════════════════════════
// FACTORY — Notification System
// Real use: different notification channels (email/push/sms)
// ════════════════════════════════════════════════════════
section("FACTORY — Notification System");

function createNotifier(channel) {
  const channels = {
    email: {
      send: ({ to, subject, body }) => {
        console.log(`  📧  Email → ${to}: "${subject}"`);
        return { channel: "email", to, sent: true };
      },
    },
    sms: {
      send: ({ to, body }) => {
        const preview = body.slice(0, 40);
        console.log(`  📱  SMS   → ${to}: "${preview}"`);
        return { channel: "sms", to, sent: true };
      },
    },
    push: {
      send: ({ title, body }) => {
        console.log(`  🔔  Push  : "${title}" — ${body}`);
        return { channel: "push", title, sent: true };
      },
    },
    slack: {
      send: ({ channel: ch, body }) => {
        console.log(`  💬  Slack → #${ch}: ${body}`);
        return { channel: "slack", to: ch, sent: true };
      },
    },
  };

  if (!channels[channel]) throw new TypeError(`Unknown channel: ${channel}`);
  return channels[channel];
}

const email = createNotifier("email");
const sms   = createNotifier("sms");
const push  = createNotifier("push");

email.send({ to: "alex@example.com", subject: "Welcome!", body: "Thanks for signing up." });
sms.send({   to: "+1-555-0100",      body: "Your verification code is 847293." });
push.send({  title: "New message",   body: "Jordan sent you a message" });


// ════════════════════════════════════════════════════════
// BUILDER — HTTP Request Builder
// Real use: construct complex fetch requests step by step
// ════════════════════════════════════════════════════════
section("BUILDER — HTTP Request Builder");

class RequestBuilder {
  #config = { method: "GET", headers: {}, params: {} };

  url(url)           { this.#config.url = url;    return this; }
  method(m)          { this.#config.method = m;   return this; }
  header(k, v)       { this.#config.headers[k] = v; return this; }
  param(k, v)        { this.#config.params[k] = v;  return this; }
  body(data)         { this.#config.body = JSON.stringify(data); return this; }
  auth(token)        { return this.header("Authorization", `Bearer ${token}`); }
  json()             { return this.header("Content-Type", "application/json"); }
  accept(type)       { return this.header("Accept", type); }
  timeout(ms)        { this.#config.timeout = ms; return this; }
  withCredentials()  { this.#config.credentials = "include"; return this; }

  build() {
    if (!this.#config.url) throw new Error("URL is required");
    const { url, params, timeout, ...init } = this.#config;
    const qs  = Object.keys(params).length
      ? "?" + new URLSearchParams(params)
      : "";
    return {
      url:     url + qs,
      init,
      timeout: timeout ?? 5000,
    };
  }
}

const req1 = new RequestBuilder()
  .url("https://api.example.com/users")
  .method("GET")
  .auth("tok_abc123")
  .param("page", 2)
  .param("limit", 10)
  .timeout(3000)
  .build();

const req2 = new RequestBuilder()
  .url("https://api.example.com/users")
  .method("POST")
  .auth("tok_abc123")
  .json()
  .body({ name: "Alex", email: "alex@example.com" })
  .build();

console.log(`  GET  ${req1.url}`);
console.log(`  POST ${req2.url}  body=${req2.init.body}`);


// ════════════════════════════════════════════════════════
// DECORATOR — Middleware Pipeline
// Real use: wrap functions with logging, timing, caching, auth
// ════════════════════════════════════════════════════════
section("DECORATOR — Middleware Pipeline");

function withTiming(fn) {
  return async function(...args) {
    const t = Date.now();
    const result = await fn.apply(this, args);
    console.log(`  ⏱  ${fn.name} took ${Date.now() - t}ms`);
    return result;
  };
}

function withCache(fn, ttl = 60000) {
  const cache = new Map();
  return async function(...args) {
    const key    = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < ttl) {
      console.log(`  💾  cache hit: ${fn.name}(${key})`);
      return cached.value;
    }
    const value = await fn.apply(this, args);
    cache.set(key, { value, at: Date.now() });
    return value;
  };
}

function withRetry(fn, retries = 3, delay = 100) {
  return async function(...args) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn.apply(this, args);
      } catch (err) {
        if (i === retries - 1) throw err;
        console.log(`  ↻  retry ${i + 1}/${retries}: ${err.message}`);
        await new Promise(r => setTimeout(r, delay * 2 ** i));
      }
    }
  };
}

function withValidation(fn, schema) {
  return async function(data, ...rest) {
    for (const [key, validate] of Object.entries(schema)) {
      const err = validate(data[key]);
      if (err) throw new TypeError(`Validation: ${key} — ${err}`);
    }
    return fn.apply(this, [data, ...rest]);
  };
}

// A simple "service function"
async function fetchUserById(id) {
  await new Promise(r => setTimeout(r, 10));
  if (id <= 0) throw new Error("Invalid ID");
  return { id, name: `User ${id}`, email: `user${id}@example.com` };
}

// Stack decorators
const getUser = withTiming(withCache(withRetry(fetchUserById)));

const u1 = await getUser(1);
const u2 = await getUser(1); // from cache
const u3 = await getUser(2);

console.log(`  user: ${u1.name}`);
console.log(`  user: ${u2.name}`);
console.log(`  user: ${u3.name}`);


// ════════════════════════════════════════════════════════
// FACADE — Media Upload Service
// Real use: hide complexity of encode + thumbnail + upload + metadata
// ════════════════════════════════════════════════════════
section("FACADE — Media Upload Service");

class MediaUploadFacade {
  async upload(file, options = {}) {
    const steps = [
      `validate(${file.name})`,
      `compress(${file.name}, quality=80)`,
      `generateThumbnail(${file.name})`,
      `uploadToCDN(${file.name})`,
      `saveMetadata(${file.name})`,
    ];

    // Simulate async sub-system calls
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 5));
      console.log(`  ✓  ${step}`);
    }

    return {
      ok:          true,
      url:         `https://cdn.example.com/media/${file.name}`,
      thumbnailUrl:`https://cdn.example.com/thumbs/${file.name}.jpg`,
      size:        file.size,
      type:        file.type,
    };
  }
}

const uploader = new MediaUploadFacade();
const result   = await uploader.upload(
  { name: "video.mp4", size: 52_000_000, type: "video/mp4" }
);
console.log(`  URL: ${result.url}`);


// ════════════════════════════════════════════════════════
// OBSERVER — Reactive Form
// Real use: form fields that update a live preview on change
// ════════════════════════════════════════════════════════
section("OBSERVER — Reactive Form State");

class FormState {
  #fields  = {};
  #errors  = {};
  #listeners = new Map();

  set(field, value) {
    this.#fields[field] = value;
    this.#validate(field, value);
    this.#emit("change", { field, value, errors: this.#errors });
    return this;
  }

  get(field)    { return this.#fields[field]; }
  getAll()      { return { ...this.#fields }; }
  getErrors()   { return { ...this.#errors }; }
  isValid()     { return Object.keys(this.#errors).length === 0; }

  #validate(field, value) {
    const rules = {
      name:  v => (!v || v.length < 2) ? "Min 2 characters" : null,
      email: v => !v?.includes("@")    ? "Invalid email"    : null,
      age:   v => (v < 0 || v > 150)   ? "Must be 0–150"   : null,
    };
    const err = rules[field]?.(value);
    if (err) this.#errors[field] = err;
    else     delete this.#errors[field];
  }

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(fn);
    return () => this.#listeners.get(event).delete(fn);
  }

  #emit(event, data) {
    this.#listeners.get(event)?.forEach(fn => fn(data));
  }
}

const form = new FormState();

form.on("change", ({ field, value, errors }) => {
  const errMsg = errors[field] ? ` ✗ ${errors[field]}` : " ✓";
  console.log(`  ${field}: "${value}"${errMsg}`);
});

form.set("name", "A");
form.set("name", "Alex");
form.set("email", "not-an-email");
form.set("email", "alex@example.com");
form.set("age", 200);
form.set("age", 30);

console.log(`  Valid: ${form.isValid()}`);
console.log(`  Data:`, form.getAll());


// ════════════════════════════════════════════════════════
// STRATEGY — Sorting Dashboard
// Real use: swap sort algorithm without changing the caller
// ════════════════════════════════════════════════════════
section("STRATEGY — Data Sorter");

const sortStrategies = {
  byName:    arr => [...arr].sort((a, b) => a.name.localeCompare(b.name)),
  byAge:     arr => [...arr].sort((a, b) => a.age - b.age),
  bySalary:  arr => [...arr].sort((a, b) => b.salary - a.salary),
  byNameDesc:arr => [...arr].sort((a, b) => b.name.localeCompare(a.name)),
};

class DataTable {
  #data;
  #strategy = "byName";

  constructor(data)       { this.#data = data; }
  sortBy(strategy)        { this.#strategy = strategy; return this; }

  render() {
    const sorted = (sortStrategies[this.#strategy] ?? sortStrategies.byName)(this.#data);
    console.log(`\n  Sorted by: ${this.#strategy}`);
    sorted.forEach(({ name, age, salary }) =>
      console.log(`  ${name.padEnd(8)} age=${age}  salary=$${salary.toLocaleString()}`)
    );
  }
}

const employees = [
  { name: "Carol", age: 25, salary: 88000 },
  { name: "Alice", age: 28, salary: 95000 },
  { name: "Dave",  age: 41, salary: 120000 },
  { name: "Bob",   age: 34, salary: 80000 },
];

const table = new DataTable(employees);
table.sortBy("byName").render();
table.sortBy("bySalary").render();


// ════════════════════════════════════════════════════════
// COMMAND — Text Editor with Undo/Redo
// Real use: any operation that needs to be reversible
// ════════════════════════════════════════════════════════
section("COMMAND — Text Editor");

class Editor {
  #text    = "";
  #history = [];
  #redo    = [];

  get text() { return this.#text; }

  run(cmd) {
    cmd.execute(this);
    this.#history.push(cmd);
    this.#redo = [];
    return this;
  }

  undo() {
    const cmd = this.#history.pop();
    if (cmd) { cmd.undo(this); this.#redo.push(cmd); }
    return this;
  }

  redo() {
    const cmd = this.#redo.pop();
    if (cmd) { cmd.execute(this); this.#history.push(cmd); }
    return this;
  }

  _set(text) { this.#text = text; }
}

const Insert = (text, at) => {
  let snapshot;
  return {
    execute(ed) { snapshot = ed.text; ed._set(ed.text.slice(0, at) + text + ed.text.slice(at)); },
    undo(ed)    { ed._set(snapshot); },
  };
};

const Delete = (from, to) => {
  let snapshot;
  return {
    execute(ed) { snapshot = ed.text; ed._set(ed.text.slice(0, from) + ed.text.slice(to)); },
    undo(ed)    { ed._set(snapshot); },
  };
};

const ed = new Editor();
ed.run(Insert("Hello, World!", 0));
console.log(`  "${ed.text}"`);
ed.run(Delete(7, 12));
console.log(`  "${ed.text}"`);
ed.run(Insert("JS", 7));
console.log(`  "${ed.text}"`);
ed.undo();
console.log(`  undo: "${ed.text}"`);
ed.undo();
console.log(`  undo: "${ed.text}"`);
ed.redo();
console.log(`  redo: "${ed.text}"`);


// ════════════════════════════════════════════════════════
// COMPOSITION — Data Processing Pipeline
// Real use: ETL — extract, transform, load
// ════════════════════════════════════════════════════════
section("FUNCTIONAL — Data Processing Pipeline");

const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const normalize  = rows => rows.map(r => ({
  id:       r.ID ?? r.id,
  name:     (r.Name ?? r.name ?? "").trim(),
  email:    (r.Email ?? r.email ?? "").toLowerCase(),
  revenue:  Number(r.Revenue ?? r.revenue ?? 0),
}));

const removeNulls    = rows => rows.filter(r => r.name && r.email);
const removeNegative = rows => rows.filter(r => r.revenue >= 0);
const enrichWithTier = rows => rows.map(r => ({
  ...r,
  tier: r.revenue > 10000 ? "enterprise"
      : r.revenue > 1000  ? "pro"
      : "free",
}));

const summarize = rows => ({
  total:      rows.length,
  revenue:    rows.reduce((s, r) => s + r.revenue, 0),
  byTier:     rows.reduce((acc, r) => {
    acc[r.tier] = (acc[r.tier] ?? 0) + 1;
    return acc;
  }, {}),
  topCustomer: [...rows].sort((a, b) => b.revenue - a.revenue)[0]?.name,
});

const processData = pipe(normalize, removeNulls, removeNegative, enrichWithTier, summarize);

const rawData = [
  { ID: 1, Name: "  Acme Corp  ", Email: "ACME@EXAMPLE.COM", Revenue: "52000" },
  { ID: 2, Name: "Globex",        Email: "info@globex.com",  Revenue: "1200"  },
  { ID: 3, Name: "",              Email: "noname@x.com",     Revenue: "500"   },
  { ID: 4, Name: "Initech",       Email: "it@initech.com",   Revenue: "150"   },
  { ID: 5, Name: "Umbrella",      Email: "corp@umbrella.com",Revenue: "-100"  },
];

const report = processData(rawData);
console.log(`  Total: ${report.total} customers`);
console.log(`  Revenue: $${report.revenue.toLocaleString()}`);
console.log(`  Tiers:`, report.byTier);
console.log(`  Top: ${report.topCustomer}`);


console.log("\n✓ All patterns demonstrated\n");
