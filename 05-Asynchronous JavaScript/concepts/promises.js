// A Promise represents an eventual value — pending, fulfilled, or rejected.
// It gives us chainable, composable async code with unified error handling.


// --- Creating a Promise ---

const p1 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("done"), 1000);
});

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error("something went wrong")), 500);
});

// Wrapping a callback-based API
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readFile(path) {
  const fs = require("fs");
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}


// --- .then / .catch / .finally ---

p1
  .then(value => {
    console.log("fulfilled:", value); // "done"
    return value.toUpperCase();       // passed to next .then
  })
  .then(upper => {
    console.log("transformed:", upper); // "DONE"
  })
  .catch(err => {
    console.error("rejected:", err.message); // handles any error above
  })
  .finally(() => {
    console.log("always runs"); // cleanup — loading state, close DB, etc.
  });


// --- Promise states ---
// pending   → initial, neither resolved nor rejected
// fulfilled → resolve() was called, .then() runs
// rejected  → reject() was called (or throw inside executor), .catch() runs
// settled   → either fulfilled or rejected — final state, can't change


// --- Short-circuit static methods ---

Promise.resolve("immediate value");        // already-fulfilled promise
Promise.reject(new Error("instant fail")); // already-rejected promise

Promise.resolve(42).then(v => console.log(v)); // 42


// --- Returning values in .then ---
// .then always returns a new Promise

Promise.resolve(1)
  .then(n => n + 1)     // return plain value → wraps in Promise.resolve
  .then(n => n * 2)     // 4
  .then(n => {
    return new Promise(resolve => setTimeout(() => resolve(n + 10), 100)); // async step
  })
  .then(n => console.log(n)); // 14


// --- Error propagation ---
// Errors skip all .then until a .catch

Promise.reject(new Error("initial error"))
  .then(v => {
    console.log("won't run");  // skipped
    return v;
  })
  .then(v => {
    console.log("also skipped");
    return v;
  })
  .catch(err => {
    console.error("caught:", err.message); // "initial error"
    return "recovered";                    // .then continues from here
  })
  .then(v => console.log(v)); // "recovered"


// --- Re-throwing in .catch ---

fetch("/api/data")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .catch(err => {
    if (err.message.startsWith("HTTP 4")) {
      return null; // handle 4xx — return fallback
    }
    throw err; // re-throw network errors
  })
  .then(data => console.log(data ?? "not found"));


// --- Promise combinators ---

const userFetch    = fetch("/api/user/1").then(r => r.json());
const settingsFetch = fetch("/api/settings").then(r => r.json());
const postsFetch   = fetch("/api/posts").then(r => r.json());


// Promise.all — wait for all, fail fast on any rejection
Promise.all([userFetch, settingsFetch, postsFetch])
  .then(([user, settings, posts]) => {
    console.log(user, settings, posts);
  })
  .catch(err => console.error("one failed:", err.message));
// If any rejects, the whole .all rejects immediately


// Promise.allSettled — wait for all, never rejects, gives you status of each
Promise.allSettled([userFetch, settingsFetch, postsFetch])
  .then(results => {
    results.forEach(({ status, value, reason }) => {
      if (status === "fulfilled") console.log("ok:", value);
      else console.error("failed:", reason.message);
    });
  });


// Promise.race — resolves/rejects with the FIRST settled promise
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("timeout")), 5000)
);

Promise.race([fetch("/api/slow-endpoint").then(r => r.json()), timeout])
  .then(data => console.log(data))
  .catch(err => console.error(err.message)); // "timeout" if slow


// Promise.any — resolves with the FIRST fulfilled (ignores rejections)
// Only rejects if ALL promises reject (AggregateError)
const mirrors = [
  fetch("https://mirror1.example.com/data").then(r => r.json()),
  fetch("https://mirror2.example.com/data").then(r => r.json()),
  fetch("https://mirror3.example.com/data").then(r => r.json()),
];

Promise.any(mirrors)
  .then(data => console.log("fastest mirror:", data))
  .catch(err => console.error("all mirrors failed:", err.errors));
