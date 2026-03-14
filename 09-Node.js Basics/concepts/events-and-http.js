import { EventEmitter } from "events";
import http  from "http";
import https from "https";
import { URL } from "url";


// ═══════════════════════════════════════════
// EVENTEMITTER
// ═══════════════════════════════════════════

// Node's built-in pub/sub. Almost every async Node API extends it.
// Streams, HTTP servers, file watchers — all EventEmitters.

const emitter = new EventEmitter();

// Register listeners
emitter.on("data",     (chunk) => console.log("data:", chunk));
emitter.on("error",    (err)   => console.error("error:", err.message));
emitter.once("connect",()      => console.log("connected once"));

// Emit events
emitter.emit("data", "Hello");
emitter.emit("connect");
emitter.emit("connect"); // won't fire — once() removed after first call

// Remove listeners
function onData(chunk) { console.log(chunk); }
emitter.on("data", onData);
emitter.off("data", onData);     // same as removeListener
emitter.removeAllListeners("data");

// Listener info
emitter.listenerCount("data");   // number of listeners
emitter.eventNames();            // ["data", "error", ...]
emitter.setMaxListeners(20);     // default is 10 — increase to avoid warnings

// ── Extending EventEmitter ──

class Database extends EventEmitter {
  #connected = false;
  #host;

  constructor(host) {
    super();
    this.#host = host;
  }

  async connect() {
    this.emit("connecting", this.#host);
    await new Promise(r => setTimeout(r, 100)); // simulate async
    this.#connected = true;
    this.emit("connect", { host: this.#host });
  }

  async query(sql) {
    if (!this.#connected) throw new Error("Not connected");
    this.emit("query", sql);
    const result = { rows: [], sql };
    this.emit("result", result);
    return result;
  }

  disconnect() {
    this.#connected = false;
    this.emit("disconnect");
  }
}

const db = new Database("localhost:5432");

db.on("connecting", host => console.log(`Connecting to ${host}...`));
db.on("connect",    ()   => console.log("Connected!"));
db.on("query",      sql  => console.log("Query:", sql));
db.on("error",      err  => console.error("DB Error:", err.message));

await db.connect();
await db.query("SELECT * FROM users");

// ── Error events are special ──
// If you emit "error" and there's no listener, Node THROWS it.
// Always add an "error" listener on EventEmitters.

const safe = new EventEmitter();
safe.on("error", (err) => console.error("handled:", err.message));
safe.emit("error", new Error("something went wrong")); // handled

// const risky = new EventEmitter();
// risky.emit("error", new Error("oops")); // throws — crashes the process!


// ── promisify EventEmitter events ──

function waitForEvent(emitter, event, errorEvent = "error") {
  return new Promise((resolve, reject) => {
    const onEvent = (...args) => { cleanup(); resolve(args.length === 1 ? args[0] : args); };
    const onError = (err)     => { cleanup(); reject(err); };
    const cleanup = ()        => { emitter.off(event, onEvent); emitter.off(errorEvent, onError); };
    emitter.once(event,      onEvent);
    emitter.once(errorEvent, onError);
  });
}

// EventEmitter → async iterable (Node 12+)
import { on } from "events";

// for await (const [data] of on(emitter, "data")) { ... }


// ═══════════════════════════════════════════
// HTTP MODULE — raw server from scratch
// ═══════════════════════════════════════════

// ── Creating a server ──

const server = http.createServer((req, res) => {
  // req: IncomingMessage (Readable stream)
  // res: ServerResponse (Writable stream)

  const url    = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;                      // "GET", "POST", etc.
  const path2  = url.pathname;                    // "/users/1"
  const query  = Object.fromEntries(url.searchParams); // { page: "2" }

  console.log(`${method} ${path2}`, query);

  // Reading request body
  if (method === "POST") {
    let body = "";
    req.on("data",  chunk => { body += chunk; });
    req.on("end",   ()    => {
      try {
        const data = JSON.parse(body);
        sendJSON(res, 201, { ok: true, data });
      } catch {
        sendJSON(res, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  // Routing
  if (method === "GET" && path2 === "/")       return sendJSON(res, 200, { message: "Hello!" });
  if (method === "GET" && path2 === "/health") return sendJSON(res, 200, { status: "ok" });
  sendJSON(res, 404, { error: "Not found" });
});

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type":   "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

server.listen(3000, () => console.log("Server on http://localhost:3000"));

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});


// ── A minimal router ──

class Router {
  #routes = [];

  #add(method, path, handler) {
    this.#routes.push({ method: method.toUpperCase(), path, handler });
    return this;
  }

  get(path, handler)    { return this.#add("GET",    path, handler); }
  post(path, handler)   { return this.#add("POST",   path, handler); }
  put(path, handler)    { return this.#add("PUT",    path, handler); }
  delete(path, handler) { return this.#add("DELETE", path, handler); }

  handle(req, res) {
    const url    = new URL(req.url, "http://localhost");
    const route  = this.#routes.find(r =>
      r.method === req.method && this.#match(r.path, url.pathname)
    );

    if (!route) { sendJSON(res, 404, { error: "Not found" }); return; }

    const params = this.#extractParams(route.path, url.pathname);
    req.params   = params;
    req.query    = Object.fromEntries(url.searchParams);

    try {
      route.handler(req, res);
    } catch (err) {
      sendJSON(res, 500, { error: err.message });
    }
  }

  #match(routePath, urlPath) {
    const rParts = routePath.split("/");
    const uParts = urlPath.split("/");
    if (rParts.length !== uParts.length) return false;
    return rParts.every((r, i) => r.startsWith(":") || r === uParts[i]);
  }

  #extractParams(routePath, urlPath) {
    const rParts = routePath.split("/");
    const uParts = urlPath.split("/");
    const params = {};
    rParts.forEach((r, i) => { if (r.startsWith(":")) params[r.slice(1)] = uParts[i]; });
    return params;
  }
}

const router = new Router();

router.get("/", (req, res) => sendJSON(res, 200, { ok: true }));
router.get("/users/:id", (req, res) => sendJSON(res, 200, { id: req.params.id }));
router.post("/users", (req, res) => {
  let body = "";
  req.on("data", c => body += c);
  req.on("end", () => {
    const data = JSON.parse(body);
    sendJSON(res, 201, { created: data });
  });
});

const server2 = http.createServer((req, res) => router.handle(req, res));
// server2.listen(3001);


// ── Making HTTP requests from Node ──

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      let body = "";
      res.on("data",  chunk => body += chunk);
      res.on("end",   ()    => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(body); }
      });
    }).on("error", reject);
  });
}

// In Node 18+ use fetch() instead — it's built in
const data = await fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then(r => r.json());
