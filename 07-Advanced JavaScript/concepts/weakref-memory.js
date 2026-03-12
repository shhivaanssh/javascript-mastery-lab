// ── Garbage Collection basics ──
// JS uses mark-and-sweep GC. An object is eligible for collection
// when no live references (roots) can reach it.
//
// Roots: global variables, local variables in active call frames,
//        closure variables, DOM nodes referenced by JS.
//
// References that PREVENT collection:
//   - Variables, object properties, array elements
//   - Map and Set entries — strong references
//
// References that DON'T prevent collection:
//   - WeakMap and WeakSet entries
//   - WeakRef targets


// ── Memory leak patterns ──

// 1. Forgotten event listeners
function attach() {
  const big = new Array(1_000_000).fill("data");
  const handler = () => console.log(big.length); // big is captured in closure
  document.addEventListener("click", handler);
  // If handler is never removed, big can never be collected
  return () => document.removeEventListener("click", handler); // return cleanup
}
const detach = attach();
// later: detach(); // cleans up big

// 2. Detached DOM nodes kept in JS
let detached;
function createNode() {
  detached = document.createElement("div"); // remove from DOM but keep reference
  document.body.appendChild(detached);
  document.body.removeChild(detached);
  // detached still referenced → can't be collected
}

// 3. Growing Maps/Sets
const cache = new Map();
function processItem(id, data) {
  cache.set(id, data); // grows forever — stale entries never cleaned
}


// ── WeakMap and WeakSet recap ──

// WeakMap: keys must be objects, entries don't prevent GC of keys
// WeakSet: values must be objects, same GC behaviour

const privateData = new WeakMap();
// When the key object is GC'd, its WeakMap entry disappears automatically
// No memory leak even without manual cleanup

class Node2 {
  constructor(value) {
    privateData.set(this, { value, processed: false });
  }
  process() {
    const data = privateData.get(this);
    data.processed = true;
  }
  get value() { return privateData.get(this).value; }
}


// ── WeakRef — hold a reference without preventing GC ──

// Normal reference — prevents GC:
let obj = { data: "important" };
const strong = obj; // obj can't be collected as long as strong exists

// WeakRef — doesn't prevent GC:
let target = { data: "maybe collected" };
const ref  = new WeakRef(target);

// Dereference — may return undefined if GC'd
ref.deref();          // { data: "maybe collected" } — if still alive
ref.deref()?.data;    // safe access


// ── WeakRef use case: optional cache ──
// Don't keep objects alive just for caching.
// If memory pressure causes GC, cache entries disappear — that's fine.

class WeakCache {
  #cache = new Map(); // Map<key, WeakRef<value>>

  set(key, value) {
    this.#cache.set(key, new WeakRef(value));
  }

  get(key) {
    const ref   = this.#cache.get(key);
    if (!ref)   return undefined;
    const value = ref.deref();
    if (!value) {
      this.#cache.delete(key); // clean up dead entry
      return undefined;
    }
    return value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }
}


// ── FinalizationRegistry — callback when an object is collected ──
// Use sparingly — GC timing is non-deterministic, not guaranteed to fire.
// Good for: logging, releasing external resources (file handles, C++ objects via WASM).

const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Object with id=${heldValue} was garbage collected`);
});

function createTracked(id) {
  const obj = { data: new Array(10_000).fill(id) };
  registry.register(obj, id); // second arg = heldValue, passed to callback
  return obj;
}

let tracked = createTracked("resource-1");
// ... use tracked ...
tracked = null; // eligible for GC — callback fires eventually


// ── Practical: external resource cleanup ──

const connectionRegistry = new FinalizationRegistry(({ connectionId, cleanup }) => {
  // obj was GC'd — clean up the external resource it was associated with
  console.warn(`Connection ${connectionId} GC'd without explicit close — cleaning up`);
  cleanup();
});

class DatabaseConnection {
  #id;
  #closed = false;

  constructor(id) {
    this.#id = id;
    connectionRegistry.register(this, {
      connectionId: id,
      cleanup: () => this.#forceClose(),
    });
    console.log(`Connection ${id} opened`);
  }

  #forceClose() {
    if (!this.#closed) {
      this.#closed = true;
      console.log(`Connection ${this.#id} force-closed`);
    }
  }

  close() {
    this.#forceClose();
    // Ideally also call registry.unregister(token) — needs a token from register()
    console.log(`Connection ${this.#id} cleanly closed`);
  }

  query(sql) {
    if (this.#closed) throw new Error("Connection is closed");
    return `Result of: ${sql}`;
  }
}


// ── Performance: avoiding unnecessary allocations ──

// Object pooling — reuse objects instead of creating/discarding
class Pool {
  #available = [];
  #factory;
  #reset;

  constructor(factory, reset) {
    this.#factory = factory;
    this.#reset   = reset;
  }

  acquire() {
    return this.#available.pop() ?? this.#factory();
  }

  release(obj) {
    this.#reset(obj);
    this.#available.push(obj);
  }
}

const vectorPool = new Pool(
  ()    => ({ x: 0, y: 0, z: 0 }),
  (vec) => { vec.x = 0; vec.y = 0; vec.z = 0; }
);

const v = vectorPool.acquire();
v.x = 10; v.y = 20;
// ... use v ...
vectorPool.release(v); // back in pool, not GC'd


// ── Measuring memory (where available) ──

// Non-standard, Chromium-only — but useful in DevTools
if (performance.memory) {
  performance.memory.usedJSHeapSize;  // bytes currently in use
  performance.memory.totalJSHeapSize; // bytes allocated
  performance.memory.jsHeapSizeLimit; // max available
}
