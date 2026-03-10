// JavaScript is single-threaded — one call stack, one thing at a time.
// "Asynchronous" doesn't mean parallel. It means: schedule this for later,
// keep the stack free, come back when it's ready.


// --- Synchronous — blocks until done ---

function syncTask(name) {
  console.log(`start: ${name}`);
  // simulate heavy work
  const end = Date.now() + 500;
  while (Date.now() < end) {} // busy-wait — blocks everything
  console.log(`end: ${name}`);
}

// syncTask("A");
// syncTask("B");
// Output is always: start A → end A → start B → end B


// --- Asynchronous — schedules and moves on ---

console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
// Output: 1 → 3 → 2
// setTimeout 0 still goes through the task queue — never runs mid-stack


// --- The event loop model ---
//
// Call Stack         Web APIs / Node APIs      Task Queue        Microtask Queue
// ──────────         ────────────────────      ──────────        ───────────────
// main()             setTimeout(fn, 1000)      [fn after 1s]     [Promise.resolve]
//
// 1. JS executes the call stack top-to-bottom
// 2. Async ops (setTimeout, fetch, fs.readFile) are handed to the runtime
// 3. When done, their callbacks land in the task queue (macrotask)
// 4. Promises land in the microtask queue instead
// 5. Event loop: when the stack is EMPTY:
//      a. Drain ALL microtasks first (even newly added ones)
//      b. Then take ONE macrotask from the task queue
//      c. Repeat


// --- Microtask vs Macrotask ---

console.log("A");

setTimeout(() => console.log("B — macrotask"), 0);

Promise.resolve().then(() => console.log("C — microtask"));

queueMicrotask(() => console.log("D — microtask"));

console.log("E");

// Output: A → E → C → D → B
// Microtasks (C, D) always run before macrotasks (B), even with setTimeout 0


// --- Why this matters in practice ---

// If you queue too many microtasks they can starve the task queue
function starvingExample() {
  function keepQueuing() {
    Promise.resolve().then(keepQueuing); // never lets macrotasks run
  }
  // keepQueuing(); // would freeze the UI/event loop — don't do this
}


// --- Visualizing the event loop step by step ---

console.log("script start");      // 1 — synchronous

setTimeout(() => {
  console.log("setTimeout");      // 5 — macrotask
}, 0);

Promise.resolve()
  .then(() => {
    console.log("promise 1");     // 3 — microtask
  })
  .then(() => {
    console.log("promise 2");     // 4 — microtask (chained from promise 1)
  });

console.log("script end");        // 2 — synchronous

// Output:
// script start
// script end
// promise 1
// promise 2
// setTimeout


// --- async functions and the event loop ---

async function demo() {
  console.log("async start");   // runs synchronously up to first await
  await Promise.resolve();      // suspends here — rest goes into microtask queue
  console.log("after await");   // resumes as microtask
}

console.log("before");
demo();
console.log("after");
// Output: before → async start → after → after await
