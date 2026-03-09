// --- Map ---
// Like an object, but keys can be anything — objects, functions, primitives.
// Maintains insertion order. Better performance for frequent add/delete.


const map = new Map();

map.set("name", "Alex");
map.set(42, "the answer");
map.set(true, "boolean key");

const objKey = { id: 1 };
map.set(objKey, "object as key"); // objects work as keys in Map, not in plain objects

map.get("name");     // "Alex"
map.get(42);         // "the answer"
map.get(objKey);     // "object as key"
map.get({ id: 1 });  // undefined — different object reference

map.has("name");     // true
map.size;            // 4
map.delete("name");
map.size;            // 3


// Iterate
const scores = new Map([
  ["Alice", 92],
  ["Bob",   85],
  ["Carol", 97],
]);

for (const [name, score] of scores) {
  console.log(`${name}: ${score}`);
}

scores.keys();   // MapIterator { "Alice", "Bob", "Carol" }
scores.values(); // MapIterator { 92, 85, 97 }
scores.entries();// MapIterator { ["Alice", 92], ... }

// Convert to/from array
const arr = [...scores];           // [["Alice", 92], ...]
const fromArr = new Map(arr);


// Map vs Object
// Use Map when:
//   - keys are not strings/symbols
//   - key count changes frequently
//   - you need insertion order guaranteed
//   - you want .size without Object.keys().length

// Use Object when:
//   - keys are strings and static
//   - you need JSON serialization (Map doesn't serialize cleanly)
//   - using as a record/struct with known shape


// --- Set ---
// Collection of unique values. Any type.

const set = new Set([1, 2, 3, 2, 1]);
set; // Set { 1, 2, 3 } — duplicates removed

set.add(4);
set.add(1);    // ignored — already exists
set.has(3);    // true
set.delete(2);
set.size;      // 3

for (const val of set) {
  console.log(val);
}

// Remove duplicates from array — the most common use
const dupes  = [1, 2, 2, 3, 3, 3, 4];
const unique = [...new Set(dupes)]; // [1, 2, 3, 4]

// Unique strings
const words  = ["apple", "banana", "apple", "cherry", "banana"];
const uniq   = [...new Set(words)]; // ["apple", "banana", "cherry"]


// Set operations
function union(a, b)        { return new Set([...a, ...b]); }
function intersection(a, b) { return new Set([...a].filter(x => b.has(x))); }
function difference(a, b)   { return new Set([...a].filter(x => !b.has(x))); }

const s1 = new Set([1, 2, 3, 4]);
const s2 = new Set([3, 4, 5, 6]);

union(s1, s2);        // {1, 2, 3, 4, 5, 6}
intersection(s1, s2); // {3, 4}
difference(s1, s2);   // {1, 2}


// --- WeakMap ---
// Keys must be objects. Keys are weakly referenced — if nothing else holds
// a reference to the key object, it can be garbage collected.
// Not iterable. No .size.

const weakMap = new WeakMap();
let element = { id: "btn" }; // simulating a DOM element

weakMap.set(element, { clickCount: 0 });
weakMap.get(element); // { clickCount: 0 }

element = null; // the entry is eligible for GC — no memory leak


// Use case: attach metadata to objects without preventing GC
const cache = new WeakMap();

function processExpensive(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = { processed: true, data: obj };
  cache.set(obj, result);
  return result;
}


// --- WeakSet ---
// Set of objects only. Weakly held. No iteration. No .size.

const weakSet = new WeakSet();
let user = { id: 1 };

weakSet.add(user);
weakSet.has(user); // true

user = null; // user eligible for GC, removed from weakSet automatically

// Use case: track which objects have been processed, without preventing GC
const processed = new WeakSet();

function process(obj) {
  if (processed.has(obj)) return;
  // do work...
  processed.add(obj);
}
