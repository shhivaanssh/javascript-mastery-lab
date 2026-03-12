// ── The iteration protocol ──
// An object is iterable if it has [Symbol.iterator]() that returns an iterator.
// An iterator is an object with a next() method that returns { value, done }.


// ── Manual iterator ──

function makeCounter(from, to) {
  let current = from;
  return {
    // The iterator IS also iterable (returns itself)
    [Symbol.iterator]() { return this; },
    next() {
      return current <= to
        ? { value: current++, done: false }
        : { value: undefined, done: true };
    },
  };
}

const counter = makeCounter(1, 3);
counter.next(); // { value: 1, done: false }
counter.next(); // { value: 2, done: false }
counter.next(); // { value: 3, done: false }
counter.next(); // { value: undefined, done: true }

for (const n of makeCounter(1, 5)) console.log(n); // 1 2 3 4 5


// ── Generators — function* and yield ──
// A generator function returns a Generator object.
// Execution pauses at each yield and resumes on the next .next() call.
// The generator object implements both the iterator AND iterable protocols.

function* counter2(from, to) {
  for (let i = from; i <= to; i++) {
    yield i; // pauses here, returns { value: i, done: false }
  }
  // implicit return → { value: undefined, done: true }
}

for (const n of counter2(1, 5)) console.log(n);
[...counter2(1, 5)]; // [1, 2, 3, 4, 5]


// ── Infinite generators ──

function* naturals(start = 1) {
  while (true) yield start++;
}

function take(n, iterable) {
  const result = [];
  for (const val of iterable) {
    result.push(val);
    if (result.length === n) break;
  }
  return result;
}

take(5, naturals());     // [1, 2, 3, 4, 5]
take(5, naturals(100));  // [100, 101, 102, 103, 104]


// ── Generator with explicit return ──

function* withReturn() {
  yield 1;
  yield 2;
  return "done";  // { value: "done", done: true }
  yield 3;        // unreachable
}

const g = withReturn();
g.next(); // { value: 1,      done: false }
g.next(); // { value: 2,      done: false }
g.next(); // { value: "done", done: true  }
g.next(); // { value: undefined, done: true }
// Note: for..of ignores the return value (skips done: true)


// ── yield* — delegating to another iterable ──

function* concat(...iterables) {
  for (const it of iterables) yield* it;
}

[...concat([1, 2], "ab", [3, 4])]; // [1, 2, "a", "b", 3, 4]

// Recursive flatten with yield*
function* flatten(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) yield* flatten(item);
    else yield item;
  }
}

[...flatten([1, [2, [3, [4]], 5]])]; // [1, 2, 3, 4, 5]


// ── Two-way communication — passing values into a generator ──

function* accumulator() {
  let total = 0;
  while (true) {
    const n = yield total; // yield sends total out, receives n from .next(n)
    if (n === null) break;
    total += n;
  }
  return total;
}

const acc = accumulator();
acc.next();    // { value: 0,  done: false } — starts the generator
acc.next(10);  // { value: 10, done: false } — total = 10
acc.next(20);  // { value: 30, done: false } — total = 30
acc.next(5);   // { value: 35, done: false }
acc.next(null);// { value: 35, done: true  } — exits


// ── Generator error handling ──

function* resilient() {
  try {
    yield 1;
    yield 2;
  } catch (err) {
    console.log("caught:", err.message);
    yield -1; // can still yield after catching
  }
  yield 3;
}

const r = resilient();
r.next();             // { value: 1, done: false }
r.throw(new Error("oops")); // "caught: oops" → { value: -1, done: false }
r.next();             // { value: 3,  done: false }


// ── Practical: lazy pipeline ──

function* map(fn, iterable) {
  for (const x of iterable) yield fn(x);
}

function* filter(pred, iterable) {
  for (const x of iterable) { if (pred(x)) yield x; }
}

function* take2(n, iterable) {
  let count = 0;
  for (const x of iterable) {
    if (count++ >= n) break;
    yield x;
  }
}

// Process lazily — only computes what's consumed
const result = take2(3,
  filter(n => n % 2 === 0,
    map(n => n * n,
      naturals()
    )
  )
);

[...result]; // [4, 16, 36] — squares of first 3 even naturals
             // Only computed 6 values total (1²..6²), not infinity


// ── Async generators ──

async function* paginate(baseUrl) {
  let page = 1;
  while (true) {
    const res  = await fetch(`${baseUrl}?page=${page}`);
    const data = await res.json();
    if (!data.items.length) break;
    yield* data.items;
    if (!data.hasNextPage) break;
    page++;
  }
}

// Consume without loading all pages into memory at once
for await (const item of paginate("/api/products")) {
  console.log(item.name);
}
