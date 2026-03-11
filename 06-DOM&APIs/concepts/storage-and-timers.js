// --- localStorage ---
// Persists data with no expiry, survives page reloads and browser restarts.
// ~5MB limit. Strings only — use JSON for objects.
// Scoped to origin (protocol + domain + port).

localStorage.setItem("theme", "dark");
localStorage.getItem("theme");      // "dark"
localStorage.removeItem("theme");
localStorage.clear();               // removes everything
localStorage.length;                // number of entries
localStorage.key(0);                // key at index 0

// Objects need JSON
const settings = { theme: "dark", fontSize: 16, notifications: true };
localStorage.setItem("settings", JSON.stringify(settings));
const loaded = JSON.parse(localStorage.getItem("settings") ?? "{}");

// Safe utility — never throws
function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full or private mode */ }
}

function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

store("prefs", { theme: "dark" });
load("prefs", { theme: "light" }); // returns stored or fallback


// --- sessionStorage ---
// Same API as localStorage. Key difference:
// Data cleared when the TAB closes (not just the browser).
// Each tab has its own sessionStorage — not shared across tabs.

sessionStorage.setItem("draft", "Work in progress...");
sessionStorage.getItem("draft");

// Use for: form drafts, current scroll position, single-session state
// Use localStorage for: user preferences, cached data, auth tokens


// --- storage event ---
// Fires in OTHER tabs/windows when localStorage changes.
// Useful for cross-tab communication.

window.addEventListener("storage", (e) => {
  e.key;      // which key changed
  e.oldValue; // previous value
  e.newValue; // new value
  e.url;      // URL of the page that made the change
  e.storageArea; // localStorage or sessionStorage object
});


// --- setTimeout ---
// Execute a function after a delay (milliseconds). Returns an ID.

const timerId = setTimeout(() => {
  console.log("runs once after 2 seconds");
}, 2000);

// Cancel before it fires
clearTimeout(timerId);

// setTimeout 0 — defer to after current call stack clears
setTimeout(() => {
  console.log("runs after synchronous code finishes");
}, 0);


// --- setInterval ---
// Execute repeatedly every N milliseconds. Returns an ID.

let count = 0;
const intervalId = setInterval(() => {
  count++;
  console.log(`tick ${count}`);
  if (count >= 5) clearInterval(intervalId); // stop after 5
}, 1000);

// Self-clearing interval pattern
function startPolling(fn, interval) {
  const id = setInterval(fn, interval);
  return () => clearInterval(id); // return a stop function
}

const stopPolling = startPolling(() => console.log("polling"), 5000);
// later: stopPolling();


// --- requestAnimationFrame (rAF) ---
// Schedule a function to run before the next browser repaint (~60fps).
// The right way to animate — smooth, battery-efficient, pauses when tab is hidden.

function animate(timestamp) {
  // timestamp is DOMHighResTimeStamp from performance.now()
  updatePositions(timestamp);
  render();
  requestAnimationFrame(animate); // schedule next frame
}

requestAnimationFrame(animate); // start the loop

// Cancel animation
const rafId = requestAnimationFrame(animate);
cancelAnimationFrame(rafId);


// --- Smooth counter animation with rAF ---
function animateCounter(el, from, to, duration) {
  const start = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - (1 - progress) ** 3; // ease-out cubic
    const current  = Math.round(from + (to - from) * eased);

    el.textContent = current.toLocaleString();

    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// animateCounter(document.querySelector("#score"), 0, 10000, 1500);


// --- Performance timing ---
const t0 = performance.now();
// ... do work ...
const t1 = performance.now();
console.log(`took ${(t1 - t0).toFixed(2)}ms`);
