// Integration tests — starts the server, makes real HTTP requests, shuts it down.
// Run: node src/test.js

process.env.NODE_ENV = "test";
process.env.DB_PATH  = ":memory:";
process.env.PORT     = "0";      // random available port

import http from "http";
import { handleRequest } from "./app.js";

// ── Minimal test runner ──

let passed = 0, failed = 0;

async function test(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe:      (expected) => { if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); },
    toEqual:   (expected) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); },
    toBeTrue:  ()         => { if (actual !== true)  throw new Error(`Expected true, got ${actual}`); },
    toBeFalse: ()         => { if (actual !== false) throw new Error(`Expected false, got ${actual}`); },
    toBeGte:   (n)        => { if (actual < n)       throw new Error(`Expected >= ${n}, got ${actual}`); },
    toBeTruthy:()         => { if (!actual)           throw new Error(`Expected truthy, got ${actual}`); },
    toContain: (str)      => { if (!String(actual).includes(str)) throw new Error(`Expected "${actual}" to contain "${str}"`); },
  };
}

// ── HTTP helper ──

let BASE;

async function api(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body:    body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

function auth(token) { return { "Authorization": `Bearer ${token}` }; }


// ── Start server ──

const server = http.createServer(handleRequest);
await new Promise(r => server.listen(0, r));
BASE = `http://localhost:${server.address().port}/api/v1`;
console.log(`\nRunning tests against ${BASE}\n`);


// ══════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════

let token, userId, habitId;

// ── Health ──
await test("GET / returns 200", async () => {
  const { status, body } = await api("GET", "/../");
  expect(status).toBe(200);
  expect(body.ok).toBeTrue();
  expect(body.data.status).toBe("ok");
});

// ── Auth: Register ──
await test("POST /auth/register creates a user", async () => {
  const { status, body } = await api("POST", "/auth/register", {
    name: "Test User", email: "test@example.com", password: "password123",
  });
  expect(status).toBe(201);
  expect(body.data.user.name).toBe("Test User");
  expect(body.data.token).toBeTruthy();
  token  = body.data.token;
  userId = body.data.user.id;
});

await test("POST /auth/register rejects duplicate email", async () => {
  const { status, body } = await api("POST", "/auth/register", {
    name: "Dup", email: "test@example.com", password: "password123",
  });
  expect(status).toBe(409);
  expect(body.ok).toBeFalse();
});

await test("POST /auth/register validates body", async () => {
  const { status, body } = await api("POST", "/auth/register", { email: "bad", password: "short" });
  expect(status).toBe(422);
  expect(body.details.length).toBeGte(1);
});

// ── Auth: Login ──
await test("POST /auth/login returns token", async () => {
  const { status, body } = await api("POST", "/auth/login", {
    email: "test@example.com", password: "password123",
  });
  expect(status).toBe(200);
  expect(body.data.token).toBeTruthy();
});

await test("POST /auth/login rejects bad password", async () => {
  const { status } = await api("POST", "/auth/login", {
    email: "test@example.com", password: "wrongpassword",
  });
  expect(status).toBe(401);
});

// ── Me ──
await test("GET /me returns current user", async () => {
  const { status, body } = await api("GET", "/me", null, auth(token));
  expect(status).toBe(200);
  expect(body.data.id).toBe(userId);
});

await test("GET /me rejects no token", async () => {
  const { status } = await api("GET", "/me");
  expect(status).toBe(401);
});

// ── Habits: Create ──
await test("POST /habits creates a habit", async () => {
  const { status, body } = await api("POST", "/habits", {
    name: "Morning Run", description: "5km every morning", frequency: "daily", color: "#22c55e",
  }, auth(token));
  expect(status).toBe(201);
  expect(body.data.name).toBe("Morning Run");
  habitId = body.data.id;
});

await test("POST /habits validates body", async () => {
  const { status, body } = await api("POST", "/habits", { name: "" }, auth(token));
  expect(status).toBe(422);
  expect(body.details.length).toBeGte(1);
});

// ── Habits: List ──
await test("GET /habits returns list", async () => {
  const { status, body } = await api("GET", "/habits", null, auth(token));
  expect(status).toBe(200);
  expect(body.data.length).toBeGte(1);
  expect(body.data[0].completedToday).toBeFalse();
});

// ── Habits: Update ──
await test("PUT /habits/:id updates a habit", async () => {
  const { status, body } = await api("PUT", `/habits/${habitId}`, {
    name: "Evening Run",
  }, auth(token));
  expect(status).toBe(200);
  expect(body.data.name).toBe("Evening Run");
});

// ── Completions: Log ──
await test("POST /habits/:id/complete logs today", async () => {
  const { status, body } = await api("POST", `/habits/${habitId}/complete`, {
    note: "Great run!",
  }, auth(token));
  expect(status).toBe(201);
});

await test("POST /habits/:id/complete rejects duplicate", async () => {
  const { status } = await api("POST", `/habits/${habitId}/complete`, {}, auth(token));
  expect(status).toBe(409);
});

await test("GET /habits after complete shows completedToday=true", async () => {
  const { body } = await api("GET", "/habits", null, auth(token));
  const habit = body.data.find(h => h.id === habitId);
  expect(habit.completedToday).toBeTrue();
});

// ── Completions: List ──
await test("GET /habits/:id/completions returns list with streak", async () => {
  const { status, body } = await api("GET", `/habits/${habitId}/completions`, null, auth(token));
  expect(status).toBe(200);
  expect(body.data.length).toBeGte(1);
  expect(body.meta.streak.current).toBeGte(1);
});

// ── Stats ──
await test("GET /stats returns stats", async () => {
  const { status, body } = await api("GET", "/stats?days=7", null, auth(token));
  expect(status).toBe(200);
  expect(body.data.summary.totalHabits).toBeGte(1);
  expect(body.data.habits.length).toBeGte(1);
  expect(body.data.habits[0].completionRate).toBeGte(0);
});

// ── Delete ──
await test("DELETE /habits/:id archives the habit", async () => {
  const { status } = await api("DELETE", `/habits/${habitId}`, null, auth(token));
  expect(status).toBe(204);
});

await test("GET /habits after delete no longer shows habit", async () => {
  const { body } = await api("GET", "/habits", null, auth(token));
  const found = body.data.find(h => h.id === habitId);
  expect(found == null).toBeTrue();
});

// ── 404 / 401 ──
// Protected routes return 401 (not 404) for unauthenticated requests —
// intentional: don't reveal route existence to unauthenticated callers
await test("Unauthenticated request to unknown route returns 401", async () => {
  const { status } = await api("GET", "/unknown");
  expect(status).toBe(401);
});

await test("Authenticated request to unknown route returns 404", async () => {
  const { status } = await api("GET", "/unknown-route", null, auth(token));
  expect(status).toBe(404);
});


// ── Summary ──
console.log(`\n${"─".repeat(46)}`);
console.log(`  ${passed} passed  ${failed > 0 ? `${failed} failed` : ""}`);
console.log("─".repeat(46));

server.close();
if (failed > 0) process.exit(1);
