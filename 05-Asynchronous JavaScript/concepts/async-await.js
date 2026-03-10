// async/await is syntax sugar over Promises.
// An async function always returns a Promise.
// await pauses execution of the async function until the Promise settles.
// The rest of the program keeps running — the stack is not blocked.


// --- Basic syntax ---

async function fetchUser(id) {
  const res  = await fetch(`/api/users/${id}`);
  const user = await res.json();
  return user; // automatically wrapped in Promise.resolve(user)
}

// Called like any async function
fetchUser(1).then(user => console.log(user));

// Or awaited inside another async function
async function main() {
  const user = await fetchUser(1);
  console.log(user);
}


// --- Error handling ---

// Without try/catch — unhandled rejection
async function risky() {
  const data = await fetch("/will-fail");    // throws on network error
  return data.json();
}

// With try/catch — handle inline
async function safe() {
  try {
    const res  = await fetch("/api/data");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetch failed:", err.message);
    return null;
  }
}

// Or catch at the call site — same as .catch() on a Promise
safe().catch(err => console.error(err));


// --- await in sequence vs parallel ---

// Sequential — total time = sum of all durations
async function sequential() {
  const a = await delay(300); // waits 300ms
  const b = await delay(300); // then waits another 300ms
  return [a, b];              // ~600ms total
}

// Parallel — total time = max duration
async function parallel() {
  const [a, b] = await Promise.all([delay(300), delay(300)]);
  return [a, b]; // ~300ms total — both run at the same time
}

// Common mistake: sequential when you meant parallel
async function mistaken() {
  const userPromise  = fetch("/api/user");    // starts here
  const postsPromise = fetch("/api/posts");   // starts here too — actually parallel
  const user  = await userPromise;            // await collects result
  const posts = await postsPromise;           // already running
  // This is actually parallel — both fetches started before either await
}


// --- await outside async --- 
// Top-level await works in ES modules (type: "module" in package.json)
// const data = await fetch("/api/data").then(r => r.json());


// --- Async with loops ---

const ids = [1, 2, 3, 4, 5];

// Sequential — one at a time, in order
async function loadSequential(ids) {
  const results = [];
  for (const id of ids) {
    const data = await fetchUser(id); // waits before next iteration
    results.push(data);
  }
  return results;
}

// Parallel — all at once
async function loadParallel(ids) {
  return Promise.all(ids.map(id => fetchUser(id)));
}

// Batched — parallel in groups (avoids overwhelming the server)
async function loadBatched(ids, batchSize = 3) {
  const results = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const data  = await Promise.all(batch.map(fetchUser));
    results.push(...data);
  }
  return results;
}

// forEach does NOT work with async — doesn't await
async function broken(ids) {
  ids.forEach(async (id) => {
    const user = await fetchUser(id); // forEach ignores the returned Promise
    console.log(user);                // timing is unpredictable
  });
}
// Use for...of or Promise.all(arr.map(...)) instead


// --- Async class methods ---

class UserService {
  #baseUrl;

  constructor(baseUrl) {
    this.#baseUrl = baseUrl;
  }

  async getUser(id) {
    const res = await fetch(`${this.#baseUrl}/users/${id}`);
    if (!res.ok) throw new Error(`User ${id} not found`);
    return res.json();
  }

  async getUsers(ids) {
    return Promise.all(ids.map(id => this.getUser(id)));
  }

  async createUser(data) {
    const res = await fetch(`${this.#baseUrl}/users`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Create failed");
    return res.json();
  }
}


// --- async/await mental model ---
// Think of await like a pause button on the current function only.
// Everything outside the function keeps running normally.
// The paused function resumes from the microtask queue when the Promise settles.

function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
