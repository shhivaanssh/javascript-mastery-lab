// fetch is the browser/Node (v18+) API for HTTP requests.
// It returns a Promise that resolves to a Response object.
// Important: fetch only rejects on network failure — HTTP 4xx/5xx still "succeed".


// --- Basic GET ---

async function getUser(id) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json(); // also returns a Promise
}


// --- Reading the response ---

async function inspectResponse(url) {
  const res = await fetch(url);

  res.status;      // 200, 404, 500, etc.
  res.statusText;  // "OK", "Not Found", etc.
  res.ok;          // true if status 200–299
  res.headers.get("content-type"); // "application/json; charset=utf-8"
  res.url;         // final URL after redirects

  // Body can only be read ONCE — pick one:
  await res.json();    // parse as JSON
  await res.text();    // parse as string
  await res.blob();    // parse as Blob (binary)
  await res.formData();
  await res.arrayBuffer();
}


// --- POST with JSON body ---

async function createPost(data) {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return res.json();
}


// --- Request options ---

const options = {
  method:      "PUT",
  headers: {
    "Content-Type":  "application/json",
    "Authorization": "Bearer <token>",
    "X-Request-ID":  crypto.randomUUID(),
  },
  body:    JSON.stringify({ name: "updated" }),
  mode:    "cors",
  cache:   "no-cache",
  credentials: "include", // send cookies cross-origin
};


// --- Error handling patterns ---

// Pattern 1 — throw on bad status, catch at call site
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// Pattern 2 — return { data, error } — never throws
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return { data: null, error: new Error(`HTTP ${res.status}`) };
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

const { data, error } = await safeFetch("/api/users");
if (error) {
  console.error("fetch error:", error.message);
} else {
  console.log(data);
}


// --- AbortController — cancel a request ---

async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), ms);

  try {
    const res  = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId); // always clear the timeout
  }
}


// Cancelling on user action (e.g. navigating away, clicking cancel)
let activeController = null;

function startSearch(query) {
  // Cancel any previous search
  activeController?.abort();

  activeController = new AbortController();

  return fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    signal: activeController.signal,
  })
    .then(r => r.json())
    .catch(err => {
      if (err.name === "AbortError") return null; // cancelled — ignore silently
      throw err;
    });
}


// --- Retry with exponential backoff ---

async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastErr;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500) {
        // Server errors are retryable
        throw new Error(`Server error: ${res.status}`);
      }
      return res.json();
    } catch (err) {
      if (err.name === "AbortError") throw err; // don't retry cancelled requests

      lastErr = err;
      const wait = 2 ** attempt * 200; // 200ms, 400ms, 800ms
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }

  throw lastErr;
}


// --- Parallel requests with fetch ---

async function loadDashboard(userId) {
  const [user, posts, notifications] = await Promise.all([
    fetchJSON(`/api/users/${userId}`),
    fetchJSON(`/api/users/${userId}/posts`),
    fetchJSON(`/api/users/${userId}/notifications`),
  ]);

  return { user, posts, notifications };
}
