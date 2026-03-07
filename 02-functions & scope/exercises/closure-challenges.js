// 1. Counter with min/max bounds
function boundedCounter(min, max, start = min) {
  let count = start;

  return {
    increment() {
      if (count < max) count++;
      return count;
    },
    decrement() {
      if (count > min) count--;
      return count;
    },
    value() { return count; },
    reset()  { count = start; return count; },
  };
}

const score = boundedCounter(0, 10, 5);
score.increment(); // 6
score.increment(); // 7
score.decrement(); // 6


// 2. Rate limiter — max N calls per time window
function rateLimit(fn, maxCalls, windowMs) {
  let calls = 0;

  setInterval(() => { calls = 0; }, windowMs);

  return function(...args) {
    if (calls >= maxCalls) {
      console.log("Rate limit hit");
      return;
    }
    calls++;
    return fn(...args);
  };
}

const limitedLog = rateLimit(console.log, 3, 1000);
// Only first 3 calls per second go through


// 3. Remember last N results
function withHistory(fn, limit = 5) {
  const history = [];

  return function(...args) {
    const result = fn(...args);
    history.push({ args, result });
    if (history.length > limit) history.shift();
    return result;
  };
}

const tracked = withHistory(n => n * 2, 3);
tracked(1); // 2
tracked(2); // 4
tracked(3); // 6
tracked(4); // 8 — oldest entry (1→2) dropped


// 4. Build an event emitter using closures
function createEmitter() {
  const listeners = {};

  return {
    on(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(l => l !== fn);
    },
    emit(event, ...args) {
      (listeners[event] || []).forEach(fn => fn(...args));
    },
  };
}

const emitter = createEmitter();
const handler = (msg) => console.log("received:", msg);

emitter.on("message", handler);
emitter.emit("message", "hello"); // "received: hello"
emitter.off("message", handler);
emitter.emit("message", "hello"); // nothing


// 5. Toggle factory
function makeToggle(...states) {
  let index = 0;

  return function() {
    const current = states[index];
    index = (index + 1) % states.length;
    return current;
  };
}

const toggle   = makeToggle("on", "off");
const traffic  = makeToggle("red", "yellow", "green");

toggle();  // "on"
toggle();  // "off"
toggle();  // "on"

traffic(); // "red"
traffic(); // "yellow"
traffic(); // "green"
traffic(); // "red"


// 6. Secret keeper
function createVault(password) {
  let secret = null;

  return {
    store(pwd, value) {
      if (pwd !== password) return "wrong password";
      secret = value;
      return "stored";
    },
    retrieve(pwd) {
      if (pwd !== password) return "wrong password";
      return secret;
    },
  };
}

const vault = createVault("abc123");
vault.store("wrong", "mydata");      // "wrong password"
vault.store("abc123", "mydata");     // "stored"
vault.retrieve("abc123");            // "mydata"
// secret is never directly accessible from outside
