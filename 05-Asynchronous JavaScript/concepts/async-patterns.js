// Real async code needs more than just try/catch.
// This file covers patterns you'll actually use in production.


// --- Result type pattern (no-throw async) ---
// Instead of throwing, return { ok, data, error }
// Inspired by Rust's Result<T, E>

async function tryCatch(promise) {
  try {
    const data = await promise;
    return { ok: true, data, error: null };
  } catch (error) {
    return { ok: false, data: null, error };
  }
}

async function loadUser(id) {
  const { ok, data, error } = await tryCatch(
    fetch(`/api/users/${id}`).then(r => r.json())
  );

  if (!ok) {
    console.error("Could not load user:", error.message);
    return null;
  }

  return data;
}


// --- Promise queue — limit concurrency ---

function createQueue(concurrency = 3) {
  let running = 0;
  const queue = [];

  function run() {
    while (running < concurrency && queue.length > 0) {
      const { task, resolve, reject } = queue.shift();
      running++;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          running--;
          run();
        });
    }
  }

  return {
    add(task) {
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        run();
      });
    },
  };
}

const queue = createQueue(2); // max 2 requests at once

const urls = ["/api/a", "/api/b", "/api/c", "/api/d", "/api/e"];
const results = await Promise.all(
  urls.map(url => queue.add(() => fetch(url).then(r => r.json())))
);


// --- Polling — keep checking until condition is met ---

async function poll(fn, { interval = 1000, timeout = 30000, until } = {}) {
  const start = Date.now();

  while (true) {
    const result = await fn();

    if (until(result)) return result;

    if (Date.now() - start >= timeout) {
      throw new Error(`Polling timed out after ${timeout}ms`);
    }

    await new Promise(r => setTimeout(r, interval));
  }
}

// Wait for a job to complete
const job = await poll(
  () => fetch("/api/jobs/123").then(r => r.json()),
  {
    interval: 2000,
    timeout:  60000,
    until: (job) => job.status === "completed" || job.status === "failed",
  }
);


// --- Serial pipeline with async reduce ---

async function asyncPipe(value, ...fns) {
  return fns.reduce(async (acc, fn) => fn(await acc), Promise.resolve(value));
}

const processed = await asyncPipe(
  userId,
  id    => fetch(`/api/users/${id}`).then(r => r.json()),
  user  => fetch(`/api/teams/${user.teamId}`).then(r => r.json()),
  team  => ({ ...team, memberCount: team.members.length }),
);


// --- Deferred promise — resolve/reject from outside ---

function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject  = rej;
  });
  return { promise, resolve, reject };
}

// Useful for tests or cross-module signaling
const { promise: ready, resolve: setReady } = createDeferred();

// somewhere else in the code:
setReady("server is up");

// awaiting side:
await ready; // waits until setReady is called


// --- async generator for streaming data ---

async function* streamLines(url) {
  const res    = await fetch(url);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }

  if (buffer.trim()) yield buffer;
}

// Process a large CSV line by line without loading it all into memory
for await (const line of streamLines("/api/export.csv")) {
  const [id, name, email] = line.split(",");
  console.log({ id, name, email });
}


// --- Error boundary — catch and categorize errors ---

class AppError extends Error {
  constructor(message, code, cause) {
    super(message);
    this.name  = "AppError";
    this.code  = code;
    this.cause = cause;
  }
}

async function apiCall(url) {
  try {
    const res = await fetch(url);

    if (res.status === 401) throw new AppError("Unauthorized", "AUTH_REQUIRED");
    if (res.status === 403) throw new AppError("Forbidden",    "PERMISSION_DENIED");
    if (res.status === 404) throw new AppError("Not found",    "NOT_FOUND");
    if (res.status >= 500)  throw new AppError("Server error", "SERVER_ERROR");
    if (!res.ok)            throw new AppError("Request failed", "HTTP_ERROR");

    return res.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Network error", "NETWORK_ERROR", err);
  }
}
