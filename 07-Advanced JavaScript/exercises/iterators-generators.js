// ── 1. Predict the output ──

function* gen() {
  yield 1;
  yield 2;
  return 3;
  yield 4; // unreachable
}

const g = gen();
// console.log(g.next()); // ?  → { value: 1, done: false }
// console.log(g.next()); // ?  → { value: 2, done: false }
// console.log(g.next()); // ?  → { value: 3, done: true  }
// console.log(g.next()); // ?  → { value: undefined, done: true }
// console.log([...gen()]); // ?  → [1, 2]  (for..of / spread ignores done:true return)


// ── 2. Implement the iterable protocol manually ──
// Make this object iterable with for..of and spread

const countdown = {
  from: 5,
  to:   1,
  [Symbol.iterator]() {
    let current = this.from;
    const end   = this.to;
    return {
      next() {
        return current >= end
          ? { value: current--, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};

console.log([...countdown]);                // [5, 4, 3, 2, 1]
for (const n of countdown) process.stdout.write(n + " "); // 5 4 3 2 1
console.log();


// ── 3. Reusable vs single-use iterators ──
// Make a class that is BOTH iterable and reusable (new iterator each call)

class Range {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end   = end;
    this.step  = step;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const { end, step } = this;
    return {
      next() {
        if (current <= end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
      // Make the iterator itself iterable (required by for..of protocol)
      [Symbol.iterator]() { return this; },
    };
  }
}

const r = new Range(0, 10, 2);
console.log([...r]);  // [0, 2, 4, 6, 8, 10]
console.log([...r]);  // [0, 2, 4, 6, 8, 10]  — reusable!


// ── 4. Generator challenges ──

// a) Zip two iterables together
function* zip(a, b) {
  const iterA = a[Symbol.iterator]();
  const iterB = b[Symbol.iterator]();
  while (true) {
    const { value: va, done: da } = iterA.next();
    const { value: vb, done: db } = iterB.next();
    if (da || db) return;
    yield [va, vb];
  }
}

console.log([...zip([1, 2, 3], ["a", "b", "c"])]);
// [[1,"a"], [2,"b"], [3,"c"]]


// b) Chunk an iterable into arrays of size n
function* chunk(n, iterable) {
  let batch = [];
  for (const item of iterable) {
    batch.push(item);
    if (batch.length === n) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) yield batch;
}

console.log([...chunk(2, [1, 2, 3, 4, 5])]);
// [[1,2], [3,4], [5]]


// c) Interleave two iterables (alternating values)
function* interleave(a, b) {
  const iterA = a[Symbol.iterator]();
  const iterB = b[Symbol.iterator]();
  let fromA = true;
  while (true) {
    const { value, done } = fromA ? iterA.next() : iterB.next();
    if (done) {
      // Drain the other
      const remaining = fromA ? iterB : iterA;
      yield* remaining;
      return;
    }
    yield value;
    fromA = !fromA;
  }
}

console.log([...interleave([1, 3, 5], [2, 4, 6, 8])]);
// [1, 2, 3, 4, 5, 6, 8]


// d) Windowed sliding view of an iterable
function* windows(n, iterable) {
  const buf = [];
  for (const item of iterable) {
    buf.push(item);
    if (buf.length > n) buf.shift();
    if (buf.length === n) yield [...buf];
  }
}

console.log([...windows(3, [1, 2, 3, 4, 5])]);
// [[1,2,3], [2,3,4], [3,4,5]]


// ── 5. Two-way generator — calculator ──
// Uses .next(value) to send values back into the generator

function* calculator() {
  let result = 0;
  while (true) {
    const [op, n] = yield result;
    if      (op === "+") result += n;
    else if (op === "-") result -= n;
    else if (op === "*") result *= n;
    else if (op === "/") result /= n;
    else if (op === "reset") result = 0;
    else throw new Error(`Unknown op: ${op}`);
  }
}

const calc = calculator();
calc.next();            // start
calc.next(["+", 10]);   // result = 10
calc.next(["*", 3]);    // result = 30
calc.next(["-", 5]);    // result = 25
const { value } = calc.next(["/", 5]);
console.log(value);     // 5


// ── 6. Lazy infinite pipeline ──

function* naturals(n = 1) { while (true) yield n++; }
function* map(fn, iter)    { for (const x of iter) yield fn(x); }
function* filter(fn, iter) { for (const x of iter) if (fn(x)) yield x; }
function* take(n, iter)    { let i = 0; for (const x of iter) { if (i++ >= n) break; yield x; } }

// Find the first 5 perfect squares that are also even
const result = [
  ...take(5,
    filter(n => n % 2 === 0,
      map(n => n * n,
        naturals()
      )
    )
  )
];

console.log(result); // [4, 16, 36, 64, 100]


// ── 7. Tree traversal with generators ──

function* inorder(node) {
  if (!node) return;
  yield* inorder(node.left);
  yield node.value;
  yield* inorder(node.right);
}

function* preorder(node) {
  if (!node) return;
  yield node.value;
  yield* preorder(node.left);
  yield* preorder(node.right);
}

const tree = {
  value: 4,
  left:  { value: 2, left: { value: 1, left: null, right: null },
                     right: { value: 3, left: null, right: null } },
  right: { value: 6, left: { value: 5, left: null, right: null },
                     right: { value: 7, left: null, right: null } },
};

console.log([...inorder(tree)]);  // [1,2,3,4,5,6,7]
console.log([...preorder(tree)]); // [4,2,1,3,6,5,7]


// ── 8. Return value from generator and yield* delegation ──

function* inner() {
  yield "a";
  yield "b";
  return "inner done"; // yield* captures this return value
}

function* outer() {
  const returnValue = yield* inner(); // yield* returns the inner's return value
  console.log("inner returned:", returnValue); // "inner done"
  yield "c";
}

console.log([...outer()]); // ["a", "b", "c"]
