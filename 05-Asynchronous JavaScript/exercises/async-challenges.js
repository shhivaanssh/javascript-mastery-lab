// Run these in Node 18+ or a browser console.
// Uses jsonplaceholder.typicode.com — free fake REST API, no key needed.

const BASE = "https://jsonplaceholder.typicode.com";

// --- Promise chain exercises ---

// 1. Fetch a post and its author in a chain
function getPostWithAuthor(postId) {
  return fetch(`${BASE}/posts/${postId}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(post => {
      return Promise.all([
        Promise.resolve(post),
        fetch(`${BASE}/users/${post.userId}`).then(r => r.json()),
      ]);
    })
    .then(([post, author]) => ({ ...post, author }));
}

getPostWithAuthor(1).then(console.log).catch(console.error);


// 2. Sequential Promise chain — add a computed field at each step
Promise.resolve({ price: 100, qty: 3 })
  .then(order => ({ ...order, subtotal: order.price * order.qty }))
  .then(order => ({ ...order, tax:      order.subtotal * 0.08 }))
  .then(order => ({ ...order, total:    order.subtotal + order.tax }))
  .then(order => console.log(`Total: $${order.total.toFixed(2)}`));


// --- async/await exercises ---

// 3. Load user + todos + posts in parallel
async function loadUserDashboard(userId) {
  const [user, todos, posts] = await Promise.all([
    fetch(`${BASE}/users/${userId}`).then(r => r.json()),
    fetch(`${BASE}/todos?userId=${userId}`).then(r => r.json()),
    fetch(`${BASE}/posts?userId=${userId}`).then(r => r.json()),
  ]);

  return {
    user,
    completedTodos: todos.filter(t => t.completed).length,
    totalTodos:     todos.length,
    postCount:      posts.length,
    latestPost:     posts.at(-1)?.title ?? "none",
  };
}

loadUserDashboard(1).then(console.log);


// 4. Retry with backoff
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      const wait = 2 ** i * 200;
      console.log(`Retry ${i + 1} in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}


// 5. Promise.allSettled — load multiple users, report success/fail each
async function loadUsersSafely(ids) {
  const results = await Promise.allSettled(
    ids.map(id => fetch(`${BASE}/users/${id}`).then(r => r.json()))
  );

  return results.map((result, i) => ({
    id: ids[i],
    status:  result.status,
    name:    result.value?.name ?? null,
    error:   result.reason?.message ?? null,
  }));
}

loadUsersSafely([1, 2, 999, 3]).then(console.log);
// 999 will fail with HTTP 404, rest succeed


// 6. Race a fetch against a timeout
async function fetchOrTimeout(url, ms = 3000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Timed out after ${ms}ms`);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}


// 7. Predict the output — event loop quiz
async function quiz() {
  console.log("1");

  const p = new Promise(resolve => {
    console.log("2");
    resolve("3");
  });

  console.log("4");

  const val = await p;
  console.log(val);

  console.log("5");
}

quiz();
console.log("6");
// Answer: 1 → 2 → 4 → 6 → 3 → 5


// 8. Build a simple request cache
function createCachedFetch(ttl = 60000) {
  const cache = new Map();

  return async function(url) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.time < ttl) {
      console.log("cache hit:", url);
      return cached.data;
    }

    const res  = await fetch(url);
    const data = await res.json();
    cache.set(url, { data, time: Date.now() });
    return data;
  };
}

const cachedFetch = createCachedFetch(30000);

// First call — network request
await cachedFetch(`${BASE}/users/1`);
// Second call within 30s — from cache
await cachedFetch(`${BASE}/users/1`);
