import fs      from "fs";
import fsp     from "fs/promises";
import path    from "path";
import http    from "http";
import { EventEmitter } from "events";
import { Transform, Readable, pipeline } from "stream";
import { promisify } from "util";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pipelineAsync = promisify(pipeline);


// ── 1. path utilities ──

function describeFile(filepath) {
  const parsed = path.parse(filepath);
  return {
    full:      filepath,
    dir:       parsed.dir,
    base:      parsed.base,
    name:      parsed.name,
    ext:       parsed.ext,
    isAbsolute:path.isAbsolute(filepath),
    depth:     filepath.split(path.sep).filter(Boolean).length,
  };
}

console.log(describeFile("/home/user/projects/app.js"));
console.log(describeFile("./src/utils/helper.ts"));


// ── 2. Safe file utilities ──

async function safeRead(filepath, fallback = null) {
  try {
    return await fsp.readFile(filepath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function safeReadJSON(filepath, fallback = {}) {
  const text = await safeRead(filepath);
  if (text === null) return fallback;
  try { return JSON.parse(text); }
  catch { return fallback; }
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function writeJSONAtomic(filepath, data) {
  await ensureDir(path.dirname(filepath));
  const tmp = filepath + ".tmp." + process.pid;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fsp.rename(tmp, filepath);
}

// Test
const tmpDir  = path.join(__dirname, ".tmp-exercises");
await ensureDir(tmpDir);
await writeJSONAtomic(path.join(tmpDir, "test.json"), { hello: "world", ts: Date.now() });
const loaded = await safeReadJSON(path.join(tmpDir, "test.json"));
console.log("Loaded:", loaded);
const missing = await safeReadJSON(path.join(tmpDir, "nonexistent.json"), { default: true });
console.log("Missing:", missing);


// ── 3. Walk directory and collect stats ──

async function analyzeDirectory(dir) {
  const stats = { files: 0, dirs: 0, totalBytes: 0, byExt: {}, largest: null };

  async function walk(current) {
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stats.dirs++;
        await walk(full);
      } else if (entry.isFile()) {
        const stat = await fsp.stat(full);
        stats.files++;
        stats.totalBytes += stat.size;
        const ext = path.extname(entry.name) || "(none)";
        stats.byExt[ext] = (stats.byExt[ext] ?? 0) + 1;
        if (!stats.largest || stat.size > stats.largest.size) {
          stats.largest = { path: full, size: stat.size };
        }
      }
    }
  }

  await walk(dir);
  return stats;
}

const projectRoot = path.join(__dirname, "..");
const dirStats    = await analyzeDirectory(projectRoot);
console.log("\nDirectory analysis:");
console.log(`  Files: ${dirStats.files}, Dirs: ${dirStats.dirs}`);
console.log(`  Total: ${(dirStats.totalBytes / 1024).toFixed(1)} KB`);
console.log(`  Extensions:`, dirStats.byExt);


// ── 4. Custom EventEmitter — typed event bus ──

class TypedEmitter extends EventEmitter {
  #schema;

  constructor(schema) {
    super();
    this.#schema = schema;
  }

  emit(event, ...args) {
    if (!this.#schema[event]) {
      throw new TypeError(`Unknown event: "${event}"`);
    }
    return super.emit(event, ...args);
  }
}

const appEvents = new TypedEmitter({
  "user:signup":  true,
  "user:login":   true,
  "order:created":true,
  "error":        true,
});

appEvents.on("user:signup",   ({ email }) => console.log(`\nNew signup: ${email}`));
appEvents.on("order:created", ({ id, total }) => console.log(`Order #${id}: $${total}`));
appEvents.on("error",         (err) => console.error("App error:", err.message));

appEvents.emit("user:signup",   { email: "alex@example.com", plan: "pro" });
appEvents.emit("order:created", { id: 1042, total: 49.99 });

try {
  appEvents.emit("unknown:event", {}); // throws
} catch (e) {
  console.log("Caught:", e.message);
}


// ── 5. Transform stream — JSON lines processor ──

class JSONLinesParser extends Transform {
  #buffer = "";
  #lineCount = 0;

  constructor() { super({ objectMode: true }); }

  _transform(chunk, _, callback) {
    this.#buffer += chunk.toString();
    const lines   = this.#buffer.split("\n");
    this.#buffer  = lines.pop(); // keep incomplete last line
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        this.#lineCount++;
        this.push(JSON.parse(line));
      } catch {
        this.emit("error", new Error(`Line ${this.#lineCount}: invalid JSON`));
      }
    }
    callback();
  }

  _flush(callback) {
    if (this.#buffer.trim()) {
      try { this.push(JSON.parse(this.#buffer)); }
      catch { /* ignore trailing incomplete line */ }
    }
    callback();
  }
}

// Write a test .jsonl file and stream-parse it
const jsonlPath = path.join(tmpDir, "test.jsonl");
await fsp.writeFile(jsonlPath, [
  JSON.stringify({ id: 1, name: "Alice", score: 92 }),
  JSON.stringify({ id: 2, name: "Bob",   score: 85 }),
  JSON.stringify({ id: 3, name: "Carol", score: 97 }),
].join("\n") + "\n");

const parser = new JSONLinesParser();
const rs     = fs.createReadStream(jsonlPath);

console.log("\nJSON Lines stream:");
rs.pipe(parser);
parser.on("data", row => console.log(`  ${row.name}: ${row.score}`));
await new Promise(r => parser.on("end", r));


// ── 6. Minimal HTTP server with routing ──

function sendJSON(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    "Content-Type":   "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  try { return JSON.parse(body); }
  catch { return body; }
}

const users = new Map([
  [1, { id: 1, name: "Alice" }],
  [2, { id: 2, name: "Bob"   }],
]);
let nextId = 3;

const exerciseServer = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const parts = pathname.split("/").filter(Boolean); // ["users", "1"]

  try {
    if (req.method === "GET"  && pathname === "/users") {
      return sendJSON(res, 200, [...users.values()]);
    }
    if (req.method === "GET"  && parts[0] === "users" && parts[1]) {
      const user = users.get(Number(parts[1]));
      return user ? sendJSON(res, 200, user) : sendJSON(res, 404, { error: "Not found" });
    }
    if (req.method === "POST" && pathname === "/users") {
      const body = await readBody(req);
      const user = { id: nextId++, name: body.name };
      users.set(user.id, user);
      return sendJSON(res, 201, user);
    }
    sendJSON(res, 404, { error: "Not found" });
  } catch (err) {
    sendJSON(res, 500, { error: err.message });
  }
});

// Start server, make a few requests, then shut it down
await new Promise(r => exerciseServer.listen(0, r)); // port 0 = random available port
const { port } = exerciseServer.address();
const base     = `http://localhost:${port}`;

console.log(`\nHTTP server on :${port}`);

const allUsers   = await fetch(`${base}/users`).then(r => r.json());
console.log("GET /users:", allUsers);

const newUser    = await fetch(`${base}/users`, {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body:    JSON.stringify({ name: "Carol" }),
}).then(r => r.json());
console.log("POST /users:", newUser);

const oneUser    = await fetch(`${base}/users/1`).then(r => r.json());
console.log("GET /users/1:", oneUser);

exerciseServer.close();

// Cleanup temp files
await fsp.rm(tmpDir, { recursive: true, force: true });
console.log("\n✓ All exercises complete");
