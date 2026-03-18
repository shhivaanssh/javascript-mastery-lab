// DevNotes — Day 2 Integration Tests
// Run: node src/test.js

process.env.NODE_ENV = "test";
process.env.DB_PATH  = ":memory:";
process.env.PORT     = "0";

import http from "http";
import { handleRequest } from "./app.js";

// ── Tiny test runner ─────────────────────────────────

let passed = 0, failed = 0;

async function test(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}\n    ${err.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe:       (e) => { if (actual !== e) throw new Error(`Expected ${JSON.stringify(e)}, got ${JSON.stringify(actual)}`); },
    toBeGte:    (n) => { if (actual < n)  throw new Error(`Expected >= ${n}, got ${actual}`); },
    toBeTruthy: ()  => { if (!actual)     throw new Error(`Expected truthy, got ${actual}`); },
    toBeFalse:  ()  => { if (actual !== false) throw new Error(`Expected false, got ${actual}`); },
    toContain:  (s) => { if (!String(actual).includes(s)) throw new Error(`Expected "${actual}" to contain "${s}"`); },
    toEqual:    (e) => { if (JSON.stringify(actual) !== JSON.stringify(e)) throw new Error(`Expected ${JSON.stringify(e)}, got ${JSON.stringify(actual)}`); },
  };
}

// ── HTTP helper ──────────────────────────────────────

let BASE;

async function api(method, path, body) {
  const res  = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body:    body != null ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// ── Start server ─────────────────────────────────────

const server = http.createServer(handleRequest);
await new Promise(r => server.listen(0, r));
BASE = `http://localhost:${server.address().port}`;
console.log(`\nRunning tests against ${BASE}\n`);

// ══════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════

let noteId, note2Id;

// ── Health ───────────────────────────────
await test("GET /health → 200", async () => {
  const { status, body } = await api("GET", "/health");
  expect(status).toBe(200);
  expect(body.data.status).toBe("ok");
});

// ── Create notes ─────────────────────────
await test("POST /api/notes → 201 with tags", async () => {
  const { status, body } = await api("POST", "/api/notes", {
    title:    "Array reduce explained",
    body:     "reduce((acc, val) => acc + val, 0) — accumulates values",
    language: "javascript",
    tags:     ["js", "arrays", "functional"],
  });
  expect(status).toBe(201);
  expect(body.data.title).toBe("Array reduce explained");
  expect(body.data.tags.length).toBe(3);
  expect(body.data.language).toBe("javascript");
  noteId = body.data.id;
});

await test("POST /api/notes → 201 pinned note", async () => {
  const { status, body } = await api("POST", "/api/notes", {
    title:  "Git cheatsheet",
    body:   "git stash, git bisect, git reflog",
    pinned: true,
    tags:   ["git", "cli"],
  });
  expect(status).toBe(201);
  expect(body.data.pinned).toBe(1);
  note2Id = body.data.id;
});

await test("POST /api/notes → 201 no tags", async () => {
  const { status } = await api("POST", "/api/notes", {
    title: "Quick note",
    body:  "something temporary",
  });
  expect(status).toBe(201);
});

await test("POST /api/notes → 422 missing title", async () => {
  const { status, body } = await api("POST", "/api/notes", {
    body: "no title here",
  });
  expect(status).toBe(422);
  expect(body.details[0].field).toBe("title");
});

await test("POST /api/notes → 422 title too long", async () => {
  const { status } = await api("POST", "/api/notes", {
    title: "x".repeat(501),
  });
  expect(status).toBe(422);
});

await test("POST /api/notes → 400 invalid JSON", async () => {
  const res = await fetch(`${BASE}/api/notes`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    "not json {{",
  });
  expect(res.status).toBe(400);
});

// ── List notes ───────────────────────────
await test("GET /api/notes → returns all notes with tags", async () => {
  const { status, body } = await api("GET", "/api/notes");
  expect(status).toBe(200);
  expect(body.data.length).toBeGte(3);
  expect(body.meta.total).toBeGte(3);
  // every note should have a tags array
  expect(Array.isArray(body.data[0].tags)).toBe(true);
});

await test("GET /api/notes → pinned notes sort first", async () => {
  const { body } = await api("GET", "/api/notes");
  expect(body.data[0].pinned).toBe(1);
});

await test("GET /api/notes?lang=javascript → filters by language", async () => {
  const { body } = await api("GET", "/api/notes?lang=javascript");
  expect(body.data.every(n => n.language === "javascript")).toBe(true);
  expect(body.data.length).toBeGte(1);
});

await test("GET /api/notes?tag=git → filters by tag", async () => {
  const { body } = await api("GET", "/api/notes?tag=git");
  expect(body.data.length).toBe(1);
  expect(body.data[0].id).toBe(note2Id);
});

await test("GET /api/notes?pinned=1 → only pinned notes", async () => {
  const { body } = await api("GET", "/api/notes?pinned=1");
  expect(body.data.every(n => n.pinned === 1)).toBe(true);
});

// ── Full-text search ─────────────────────
await test("GET /api/notes?q=reduce → FTS returns match", async () => {
  const { status, body } = await api("GET", "/api/notes?q=reduce");
  expect(status).toBe(200);
  expect(body.data.length).toBeGte(1);
  expect(body.data[0].title.toLowerCase()).toContain("reduce");
});

await test("GET /api/notes?q=stash → FTS searches body text", async () => {
  const { body } = await api("GET", "/api/notes?q=stash");
  expect(body.data.length).toBeGte(1);
});

await test("GET /api/notes?q=zzznomatch → FTS returns empty", async () => {
  const { body } = await api("GET", "/api/notes?q=zzznomatch");
  expect(body.data.length).toBe(0);
  expect(body.meta.total).toBe(0);
});

await test("GET /api/notes?q=git&tag=git → combined FTS + tag filter", async () => {
  const { body } = await api("GET", "/api/notes?q=git&tag=git");
  expect(body.data.length).toBeGte(1);
});

// ── Pagination ───────────────────────────
await test("GET /api/notes?limit=2 → respects limit", async () => {
  const { body } = await api("GET", "/api/notes?limit=2");
  expect(body.data.length).toBe(2);
  expect(body.meta.limit).toBe(2);
  expect(body.meta.pages).toBeGte(2);
});

await test("GET /api/notes?page=2&limit=2 → page 2", async () => {
  const p1 = await api("GET", "/api/notes?page=1&limit=2");
  const p2 = await api("GET", "/api/notes?page=2&limit=2");
  // IDs on page 2 should not appear on page 1
  const ids1 = p1.body.data.map(n => n.id);
  const ids2 = p2.body.data.map(n => n.id);
  expect(ids1.some(id => ids2.includes(id))).toBeFalse();
});

// ── Get one note ─────────────────────────
await test("GET /api/notes/:id → returns note with tags", async () => {
  const { status, body } = await api("GET", `/api/notes/${noteId}`);
  expect(status).toBe(200);
  expect(body.data.id).toBe(noteId);
  expect(Array.isArray(body.data.tags)).toBe(true);
});

await test("GET /api/notes/999 → 404", async () => {
  const { status } = await api("GET", "/api/notes/999");
  expect(status).toBe(404);
});

// ── Update note ──────────────────────────
await test("PUT /api/notes/:id → updates fields", async () => {
  const { status, body } = await api("PUT", `/api/notes/${noteId}`, {
    title:  "Array reduce — deep dive",
    pinned: true,
  });
  expect(status).toBe(200);
  expect(body.data.title).toBe("Array reduce — deep dive");
  expect(body.data.pinned).toBe(1);
  // body and language unchanged
  expect(body.data.language).toBe("javascript");
});

await test("PUT /api/notes/:id → replaces tags", async () => {
  const { body } = await api("PUT", `/api/notes/${noteId}`, {
    tags: ["js", "must-know"],
  });
  expect(body.data.tags.length).toBe(2);
  expect(body.data.tags).toContain("js");
  expect(body.data.tags).toContain("must-know");
});

await test("PUT /api/notes/:id → clears tags with []", async () => {
  const { body } = await api("PUT", `/api/notes/${noteId}`, { tags: [] });
  expect(body.data.tags.length).toBe(0);
});

await test("PUT /api/notes/999 → 404", async () => {
  const { status } = await api("PUT", "/api/notes/999", { title: "ghost" });
  expect(status).toBe(404);
});

// ── Tags ────────────────────────────────
await test("GET /api/tags → lists all tags with counts", async () => {
  // Re-add some tags first
  await api("PUT", `/api/notes/${noteId}`, { tags: ["js", "arrays"] });

  const { status, body } = await api("GET", "/api/tags");
  expect(status).toBe(200);
  expect(body.data.length).toBeGte(1);
  expect(body.data[0]).toEqual({ id: body.data[0].id, name: expect(body.data[0].name) ? body.data[0].name : null, count: body.data[0].count });
  // sorted by count desc
  expect(body.data[0].count).toBeGte(body.data.at(-1).count);
});

// ── Delete ───────────────────────────────
await test("DELETE /api/notes/:id → 204", async () => {
  const { status } = await api("DELETE", `/api/notes/${noteId}`);
  expect(status).toBe(204);
});

await test("GET /api/notes/:id after delete → 404", async () => {
  const { status } = await api("GET", `/api/notes/${noteId}`);
  expect(status).toBe(404);
});

await test("DELETE /api/notes/999 → 404", async () => {
  const { status } = await api("DELETE", "/api/notes/999");
  expect(status).toBe(404);
});

// ── Unknown route ────────────────────────
await test("GET /api/unknown → 404", async () => {
  const { status } = await api("GET", "/api/unknown");
  expect(status).toBe(404);
});


// ── Summary ──────────────────────────────

console.log(`\n${"─".repeat(44)}`);
console.log(`  ${passed} passed  ${failed > 0 ? `${failed} failed` : "🎉 all green"}`);
console.log("─".repeat(44));

server.close();
if (failed > 0) process.exit(1);
