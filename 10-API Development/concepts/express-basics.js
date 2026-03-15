// Express.js is the most popular Node.js web framework.
// It wraps Node's http module and adds routing, middleware, and convenience.
//
// Install: npm install express
// Types:   npm install -D @types/express


import express from "express";

const app = express();


// ── Middleware ──
// Middleware = a function(req, res, next) in a pipeline.
// Each middleware can read/modify req and res, then call next() to continue,
// or call res.json() etc. to end the chain.
//
//  req ──► [mw1] ──► [mw2] ──► [route handler] ──► res

// Built-in middleware
app.use(express.json());                          // parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // parse form bodies
app.use(express.static("public"));                // serve static files

// Custom middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  console.log(`[${req.id}] ${req.method} ${req.url}`);
  next(); // must call next() or the request hangs
});

// Middleware with options (factory pattern)
function rateLimit({ windowMs = 60000, max = 100 } = {}) {
  const counts = new Map();
  return (req, res, next) => {
    const key  = req.ip;
    const now  = Date.now();
    const data = counts.get(key) ?? { count: 0, reset: now + windowMs };
    if (now > data.reset) { data.count = 0; data.reset = now + windowMs; }
    data.count++;
    counts.set(key, data);
    res.set("X-RateLimit-Limit",     max);
    res.set("X-RateLimit-Remaining", Math.max(0, max - data.count));
    if (data.count > max) return res.status(429).json({ error: "Rate limit exceeded" });
    next();
  };
}

app.use(rateLimit({ max: 100 }));


// ── Routing ──

// Basic routes
app.get("/",        (req, res) => res.json({ ok: true }));
app.get("/health",  (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

// Route params
app.get("/users/:id", (req, res) => {
  const { id } = req.params;       // from the URL
  const { page = 1 } = req.query; // from ?page=2
  res.json({ id, page: Number(page) });
});

// Request body
app.post("/users", (req, res) => {
  const { name, email } = req.body; // requires express.json() middleware
  res.status(201).json({ id: Date.now(), name, email });
});

// Multiple methods — same path
app.route("/users/:id")
  .get(   (req, res) => res.json({ id: req.params.id }))
  .put(   (req, res) => res.json({ updated: true }))
  .delete((req, res) => res.status(204).end());


// ── Express Router — modular routing ──

const usersRouter = express.Router();

// All routes here are prefixed with /users (set when mounting below)
usersRouter.use((req, res, next) => {
  // This middleware only runs for /users routes
  console.log("users router middleware");
  next();
});

usersRouter.get("/",     listUsers);
usersRouter.post("/",    createUser);
usersRouter.get("/:id",  getUser);
usersRouter.put("/:id",  updateUser);
usersRouter.delete("/:id", deleteUser);

app.use("/users", usersRouter);
// GET /users     → listUsers
// POST /users    → createUser
// GET /users/42  → getUser


// ── Response methods ──

app.get("/demo", (req, res) => {
  res.status(200);                      // set status code
  res.set("X-Custom", "value");         // set header
  res.json({ key: "value" });           // send JSON (also sets Content-Type)
  // res.send("plain text");            // send text
  // res.sendFile("/path/to/file.html");// send a file
  // res.redirect(301, "/new-path");    // redirect
  // res.status(204).end();             // no body
});


// ── Error handling ──

// Errors fall through middleware until an error handler catches them
// Error handler has 4 args — Express identifies it by arity

// Throw in async route — must be caught and passed to next()
usersRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err); // pass to error handler
  }
});

// Or use a wrapper to avoid try/catch in every route
const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

usersRouter.get("/:id", asyncRoute(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}));

// Centralised error handler — put this LAST
app.use((err, req, res, next) => {
  console.error(`[${req.id}] Error:`, err.message);

  if (err.name === "ValidationError") {
    return res.status(422).json({ error: "Validation failed", details: err.details });
  }
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid token" });
  }
  // Generic fallback — don't leak stack traces in production
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status ?? 500).json({
    error: isProd ? "Internal server error" : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// 404 handler — put after all routes, before error handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});


// ── Starting the server ──

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export app for testing
export default app;


// ── Request / Response cheat sheet ──
//
// req.params     — route params          /users/:id  → req.params.id
// req.query      — query string          ?page=2     → req.query.page
// req.body       — parsed body (needs middleware)
// req.headers    — request headers
// req.ip         — client IP
// req.method     — "GET", "POST", etc.
// req.path       — "/users/42"
// req.url        — "/users/42?page=1"
// req.is("json") — true if Content-Type is JSON
//
// res.status(n)  — set status code (chainable)
// res.set(k, v)  — set header
// res.json(data) — send JSON response
// res.send(str)  — send text
// res.redirect(url)
// res.status(204).end()


// Stub functions to prevent errors
function listUsers  (req, res) { res.json([]); }
function createUser (req, res) { res.status(201).json({}); }
function getUser    (req, res) { res.json({}); }
function updateUser (req, res) { res.json({}); }
function deleteUser (req, res) { res.status(204).end(); }
function getUserById(id) { return Promise.resolve(null); }
