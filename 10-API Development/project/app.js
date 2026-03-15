import http   from "http";
import crypto from "crypto";
import { stmt, db, calcStreak } from "./db.js";
import { hashPassword, verifyPassword, signJWT, verifyJWT } from "./auth.js";
import { config } from "./config.js";


// ══════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; if (data.length > 100_000) req.destroy(new Error("Payload too large")); });
    req.on("end",  ()    => {
      try   { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(Object.assign(new Error("Invalid JSON body"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  const body = JSON.stringify({ ok: status < 400, ...data });
  res.writeHead(status, {
    "Content-Type":   "application/json",
    "Content-Length": Buffer.byteLength(body),
    "X-Request-ID":   res._reqId,
  });
  res.end(body);
}

function applyCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age",       "86400");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}


// ══════════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════════

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
  return body;
}

const required  = () => (v, f) => (v == null || v === "") ? `${f} is required` : null;
const isStr     = (min = 1, max = 500) => (v, f) =>
  typeof v !== "string"                 ? `${f} must be a string`
  : v.trim().length < min               ? `${f} must be at least ${min} characters`
  : v.trim().length > max               ? `${f} must be at most ${max} characters`
  : null;
const isEmail   = () => (v, f) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? `${f} must be a valid email` : null;
const oneOf     = (...opts) => (v, f) => v != null && !opts.includes(v)   ? `${f} must be one of: ${opts.join(", ")}` : null;
const isHex     = () => (v, f) => v != null && !/^#[0-9a-f]{6}$/i.test(v) ? `${f} must be a hex color` : null;
const isDate    = () => (v, f) => v != null && !/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${f} must be YYYY-MM-DD` : null;


// ══════════════════════════════════════════════
// MIDDLEWARE PIPELINE
// ══════════════════════════════════════════════

async function runMiddleware(req, res, middlewares) {
  for (const mw of middlewares) {
    let done = false;
    await mw(req, res, () => { done = true; });
    if (!done) return false; // middleware ended the response
  }
  return true;
}

function requireAuth(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    send(res, 401, { error: "Authentication required", code: "UNAUTHORIZED" });
    return;
  }
  try {
    req.user = verifyJWT(auth.slice(7));
    next();
  } catch (err) {
    send(res, err.status ?? 401, { error: err.message, code: err.code ?? "UNAUTHORIZED" });
  }
}


// ══════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════

// ── Auth ──

async function registerHandler(req, res) {
  const body = await readBody(req);
  validate(body, {
    name:     [required(), isStr(2, 100)],
    email:    [required(), isStr(3, 200), isEmail()],
    password: [required(), isStr(8, 128)],
  });

  if (stmt.getUserByEmail.get(body.email)) {
    throw Object.assign(new Error("Email already registered"), { status: 409, code: "CONFLICT" });
  }

  const hashed = await hashPassword(body.password);
  const result = stmt.createUser.run(body.name.trim(), body.email.toLowerCase().trim(), hashed);
  const user   = stmt.getUserById.get(result.lastInsertRowid);
  const token  = signJWT({ sub: String(user.id), name: user.name });

  send(res, 201, { data: { user, token } });
}

async function loginHandler(req, res) {
  const body = await readBody(req);
  validate(body, {
    email:    [required(), isEmail()],
    password: [required()],
  });

  const user = stmt.getUserByEmail.get(body.email.toLowerCase().trim());
  if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401, code: "INVALID_CREDENTIALS" });

  const valid = await verifyPassword(body.password, user.password);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { status: 401, code: "INVALID_CREDENTIALS" });

  const token = signJWT({ sub: String(user.id), name: user.name });
  const { password: _, ...safeUser } = user;
  send(res, 200, { data: { user: safeUser, token } });
}

function meHandler(req, res) {
  const user = stmt.getUserById.get(Number(req.user.sub));
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  send(res, 200, { data: user });
}


// ── Habits ──

async function listHabitsHandler(req, res) {
  const userId = Number(req.user.sub);
  const habits = stmt.listHabits.all(userId);

  // Attach today's completion status to each habit
  const todayStr = today();
  const enriched = habits.map(h => ({
    ...h,
    completedToday: !!stmt.getCompletion.get(h.id, todayStr),
    totalCompletions: stmt.completionCount.get(h.id, userId).total,
  }));

  send(res, 200, { data: enriched });
}

async function createHabitHandler(req, res) {
  const body   = await readBody(req);
  const userId = Number(req.user.sub);

  validate(body, {
    name:        [required(), isStr(1, 200)],
    description: [],
    frequency:   [oneOf("daily", "weekly")],
    color:       [isHex()],
  });

  const result = stmt.createHabit.run(
    userId,
    body.name.trim(),
    (body.description ?? "").trim(),
    body.frequency ?? "daily",
    body.color     ?? "#6366f1"
  );

  const habit = stmt.getHabit.get(result.lastInsertRowid, userId);
  send(res, 201, { data: habit });
}

async function updateHabitHandler(req, res, habitId) {
  const userId = Number(req.user.sub);
  const habit  = stmt.getHabit.get(habitId, userId);
  if (!habit) throw Object.assign(new Error("Habit not found"), { status: 404 });

  const body = await readBody(req);
  validate(body, {
    name:        [isStr(1, 200)],
    description: [],
    frequency:   [oneOf("daily", "weekly")],
    color:       [isHex()],
  });

  stmt.updateHabit.run(
    (body.name        ?? habit.name).trim(),
    (body.description ?? habit.description).trim(),
    body.frequency    ?? habit.frequency,
    body.color        ?? habit.color,
    habitId, userId
  );

  send(res, 200, { data: stmt.getHabit.get(habitId, userId) });
}

function deleteHabitHandler(req, res, habitId) {
  const userId = Number(req.user.sub);
  const habit  = stmt.getHabit.get(habitId, userId);
  if (!habit) throw Object.assign(new Error("Habit not found"), { status: 404 });
  stmt.archiveHabit.run(habitId, userId);
  res.writeHead(204); res.end();
}


// ── Completions ──

async function logCompletionHandler(req, res, habitId) {
  const userId = Number(req.user.sub);
  const habit  = stmt.getHabit.get(habitId, userId);
  if (!habit) throw Object.assign(new Error("Habit not found"), { status: 404 });

  const body = await readBody(req);
  validate(body, { date: [isDate()], note: [] });

  const date   = body.date ?? today();
  const result = stmt.logCompletion.run(habitId, userId, date, (body.note ?? "").trim());

  if (result.changes === 0) {
    throw Object.assign(new Error("Already completed on this date"), { status: 409, code: "CONFLICT" });
  }

  send(res, 201, { data: { habitId, date, note: body.note ?? "" } });
}

async function removeCompletionHandler(req, res, habitId) {
  const userId = Number(req.user.sub);
  const body   = await readBody(req);
  const date   = body.date ?? today();

  stmt.removeCompletion.run(habitId, userId, date);
  res.writeHead(204); res.end();
}

function listCompletionsHandler(req, res, habitId) {
  const userId = Number(req.user.sub);
  const habit  = stmt.getHabit.get(habitId, userId);
  if (!habit) throw Object.assign(new Error("Habit not found"), { status: 404 });

  const url    = new URL(req.url, "http://localhost");
  const limit  = Math.min(Number(url.searchParams.get("limit") ?? 30), 365);
  const rows   = stmt.listCompletions.all(habitId, userId, limit);

  // Calculate streaks
  const dates  = rows.map(r => r.completed_on);
  const streak = calcStreak(dates);

  send(res, 200, { data: rows, meta: { streak, total: stmt.completionCount.get(habitId, userId).total } });
}


// ── Stats ──

function statsHandler(req, res) {
  const userId = Number(req.user.sub);
  const url    = new URL(req.url, "http://localhost");
  const days   = Math.min(Number(url.searchParams.get("days") ?? 30), 365);

  const endDate   = today();
  const startDate = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);

  const habits     = stmt.listHabits.all(userId);
  const inRange    = stmt.habitCompletionsInRange.all(userId, startDate, endDate);
  const countMap   = Object.fromEntries(inRange.map(r => [r.habit_id, r.count]));
  const recent     = stmt.recentCompletions.all(userId, 10);

  const habitStats = habits.map(h => {
    const allDates = stmt.completionDates.all(h.id, userId).map(r => r.completed_on);
    const streak   = calcStreak(allDates);
    return {
      id:           h.id,
      name:         h.name,
      color:        h.color,
      frequency:    h.frequency,
      completionsInPeriod: countMap[h.id] ?? 0,
      completionRate: days > 0 ? +((countMap[h.id] ?? 0) / days * 100).toFixed(1) : 0,
      streak:       streak.current,
      longestStreak:streak.longest,
    };
  });

  const totalCompletions = inRange.reduce((s, r) => s + r.count, 0);
  const topHabit         = [...habitStats].sort((a, b) => b.completionsInPeriod - a.completionsInPeriod)[0] ?? null;

  send(res, 200, {
    data: {
      period:    { start: startDate, end: endDate, days },
      summary: {
        totalHabits:      habits.length,
        totalCompletions,
        avgPerDay:        +(totalCompletions / days).toFixed(2),
        topHabit:         topHabit ? { id: topHabit.id, name: topHabit.name } : null,
      },
      habits: habitStats,
      recentActivity: recent,
    },
  });
}


// ══════════════════════════════════════════════
// ROUTER
// ══════════════════════════════════════════════

export async function handleRequest(req, res) {
  const reqId = crypto.randomUUID().slice(0, 8);
  res._reqId  = reqId;

  applyCORS(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204); res.end(); return;
  }

  const url   = new URL(req.url, "http://localhost");
  const path  = url.pathname.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean); // ["api","v1","habits","1"]

  // Strip /api/v1 prefix
  if (parts[0] === "api") parts.shift();
  if (parts[0] === "v1")  parts.shift();

  const [resource, idOrSub, sub] = parts;
  const id = idOrSub && /^\d+$/.test(idOrSub) ? Number(idOrSub) : null;

  try {
    // ── Health ──
    if (!resource && req.method === "GET") {
      return send(res, 200, { data: { status: "ok", version: "1.0.0", uptime: Math.round(process.uptime()) } });
    }

    // ── Auth routes (no auth required) ──
    if (resource === "auth") {
      if (idOrSub === "register" && req.method === "POST") return await registerHandler(req, res);
      if (idOrSub === "login"    && req.method === "POST") return await loginHandler(req, res);
      return send(res, 404, { error: "Not found" });
    }

    // ── Protected routes ──
    let authed = false;
    requireAuth(req, res, () => { authed = true; });
    if (!authed) return;

    if (resource === "me" && req.method === "GET") return await meHandler(req, res);

    if (resource === "habits") {
      if (!id) {
        if (req.method === "GET")  return await listHabitsHandler(req, res);
        if (req.method === "POST") return await createHabitHandler(req, res);
      } else if (!sub) {
        if (req.method === "GET")    return send(res, 200, { data: stmt.getHabit.get(id, Number(req.user.sub)) });
        if (req.method === "PUT")    return await updateHabitHandler(req, res, id);
        if (req.method === "PATCH")  return await updateHabitHandler(req, res, id);
        if (req.method === "DELETE") return await deleteHabitHandler(req, res, id);
      } else if (sub === "complete") {
        if (req.method === "POST")   return await logCompletionHandler(req, res, id);
        if (req.method === "DELETE") return await removeCompletionHandler(req, res, id);
      } else if (sub === "completions") {
        if (req.method === "GET")    return await listCompletionsHandler(req, res, id);
      }
    }

    if (resource === "stats" && req.method === "GET") return await statsHandler(req, res);

    send(res, 404, { error: `Cannot ${req.method} ${path}` });

  } catch (err) {
    const status = err.status ?? 500;

    if (status >= 500) {
      console.error(`[${reqId}] ${req.method} ${path} → ${status}`, err.message);
      if (config.isDev) console.error(err.stack);
    } else {
      console.log(`[${reqId}] ${req.method} ${path} → ${status} ${err.message}`);
    }

    if (err instanceof ValidationError) {
      return send(res, 422, { error: err.message, code: err.code, details: err.details });
    }

    send(res, status, {
      error:   config.isProd && status >= 500 ? "Internal server error" : err.message,
      code:    err.code ?? "INTERNAL_ERROR",
    });
  }
}
