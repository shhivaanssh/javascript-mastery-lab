// Module 02 Mini Project — function-playground
// A small utility library built entirely from scratch using closures and HOFs.
// Run: node index.js

const counter   = require("./counter");
const memoize   = require("./memoize");
const compose   = require("./compose");
const utilities = require("./utilities");

console.log("=== Counter ===");
const c = counter.create(0, { min: 0, max: 5 });
console.log(c.increment()); // 1
console.log(c.increment()); // 2
console.log(c.increment()); // 3
console.log(c.add(10));     // capped at 5
console.log(c.value());     // 5
console.log(c.reset());     // 0

console.log("\n=== Memoize ===");
let fib_calls = 0;
const fib = memoize.create(function fibonacci(n) {
  fib_calls++;
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fib(10));       // 55
console.log(fib(10));       // 55 (cache hit)
console.log(`calls: ${fib_calls}`);
console.log(memoize.stats(fib));

console.log("\n=== Compose / Pipe ===");
const { pipe, compose: comp } = compose;

const process = pipe(
  s => s.trim(),
  s => s.toLowerCase(),
  s => s.replace(/\s+/g, "-"),
  s => `slug: ${s}`
);

console.log(process("  Hello World  ")); // "slug: hello-world"

const reverse = comp(
  s => `[${s}]`,
  s => s.toUpperCase(),
  s => s.trim()
);
console.log(reverse("  hello  ")); // "[HELLO]"

console.log("\n=== Utilities ===");
const { once, debounce, throttle, partial, curry } = utilities;

// once
const init = once(() => {
  console.log("initialized");
  return true;
});
init(); // logs
init(); // silent
init(); // silent

// partial
const multiply = (a, b, c) => a * b * c;
const double = partial(multiply, 2, 1);
console.log(double(5)); // 10

// curry
const add = curry((a, b, c) => a + b + c);
console.log(add(1)(2)(3));  // 6
console.log(add(1, 2)(3));  // 6
