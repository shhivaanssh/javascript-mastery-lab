// --- The iteration protocol ---
// An object is iterable if it has a [Symbol.iterator] method
// that returns an iterator object with a .next() method.
// .next() returns { value, done }.

// This is what powers: for...of, spread, destructuring, Array.from


// --- Custom iterator ---

function makeRange(start, end, step = 1) {
  return {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if (current <= end) {
            const value = current;
            current += step;
            return { value, done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

const range = makeRange(0, 10, 2);
[...range];              // [0, 2, 4, 6, 8, 10]
for (const n of range) console.log(n);

// Iterating manually
const iter = makeRange(1, 3)[Symbol.iterator]();
iter.next(); // { value: 1, done: false }
iter.next(); // { value: 2, done: false }
iter.next(); // { value: 3, done: false }
iter.next(); // { value: undefined, done: true }


// --- Generators ---
// A generator is a function that can pause and resume execution.
// `function*` syntax, `yield` to pause and emit a value.
// Returns a generator object that is both an iterator and iterable.

function* simpleGen() {
  console.log("start");
  yield 1;
  console.log("after 1");
  yield 2;
  console.log("after 2");
  yield 3;
  console.log("done");
}

const gen = simpleGen();
gen.next(); // logs "start",   returns { value: 1, done: false }
gen.next(); // logs "after 1", returns { value: 2, done: false }
gen.next(); // logs "after 2", returns { value: 3, done: false }
gen.next(); // logs "done",    returns { value: undefined, done: true }


// --- Generator as range ---
// Much cleaner than the manual iterator above

function* range(start, end, step = 1) {
  for (let i = start; i <= end; i += step) {
    yield i;
  }
}

[...range(1, 5)];         // [1, 2, 3, 4, 5]
[...range(0, 10, 2)];     // [0, 2, 4, 6, 8, 10]


// --- Infinite generators ---
// Can represent infinite sequences — only compute what's consumed

function* naturals(start = 1) {
  let n = start;
  while (true) {
    yield n++;
  }
}

function take(n, iterable) {
  const result = [];
  for (const val of iterable) {
    result.push(val);
    if (result.length >= n) break;
  }
  return result;
}

take(5, naturals());     // [1, 2, 3, 4, 5]
take(5, naturals(10));   // [10, 11, 12, 13, 14]


// --- yield* — delegate to another iterable ---

function* flatten(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) {
      yield* flatten(item); // recursively yield from nested array
    } else {
      yield item;
    }
  }
}

[...flatten([1, [2, [3, 4]], [5, 6]])]; // [1, 2, 3, 4, 5, 6]


// --- Two-way communication with generators ---
// You can pass values back into a generator via gen.next(value)

function* calculator() {
  let result = 0;
  while (true) {
    const input = yield result;
    if (input === null) break;
    result += input;
  }
  return result;
}

const calc = calculator();
calc.next();     // start the generator, returns { value: 0 }
calc.next(5);    // result = 0 + 5 = 5
calc.next(3);    // result = 5 + 3 = 8
calc.next(null); // break, returns { value: 8, done: true }


// --- Practical: paginated data fetching ---

async function* fetchPages(url) {
  let page = 1;

  while (true) {
    const res  = await fetch(`${url}?page=${page}`);
    const data = await res.json();

    if (!data.items.length) break;

    yield data.items;
    page++;
  }
}

// Usage:
// for await (const items of fetchPages("/api/users")) {
//   console.log(items);
// }
