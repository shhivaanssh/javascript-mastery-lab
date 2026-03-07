// A higher-order function either takes a function as an argument,
// or returns a function. Both count.


// --- Functions as arguments ---

function applyToAll(arr, fn) {
  const result = [];
  for (const item of arr) {
    result.push(fn(item));
  }
  return result;
}

applyToAll([1, 2, 3], n => n * 2);  // [2, 4, 6]
applyToAll(["hi", "hey"], s => s.toUpperCase()); // ["HI", "HEY"]


// --- Functions as return values ---

function makeAdder(x) {
  return (y) => x + y;
}

const add5  = makeAdder(5);
const add10 = makeAdder(10);

add5(3);  // 8
add10(3); // 13


// --- Compose ---
// Run functions right to left, feeding output into the next

function compose(...fns) {
  return (value) => fns.reduceRight((acc, fn) => fn(acc), value);
}

const trim       = s => s.trim();
const lowercase  = s => s.toLowerCase();
const addPrefix  = s => `user_${s}`;

const formatUsername = compose(addPrefix, lowercase, trim);
formatUsername("  ALEX  "); // "user_alex"


// --- Pipe ---
// Same as compose but left to right (easier to read)

function pipe(...fns) {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}

const process = pipe(trim, lowercase, addPrefix);
process("  JORDAN  "); // "user_jordan"


// --- Curry ---
// Transform a multi-argument function into a chain of single-argument functions

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...more) => curried(...args, ...more);
  };
}

function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
curriedAdd(1)(2)(3);  // 6
curriedAdd(1, 2)(3);  // 6
curriedAdd(1)(2, 3);  // 6


// --- Real-world HOF patterns ---

// Retry — wraps any async function with retry logic
function withRetry(fn, retries = 3) {
  return async function(...args) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn(...args);
      } catch (err) {
        if (attempt === retries) throw err;
        console.log(`Attempt ${attempt} failed, retrying...`);
      }
    }
  };
}

// Logger — wraps a function and logs calls
function withLogging(fn, name = fn.name) {
  return function(...args) {
    console.log(`Calling ${name} with`, args);
    const result = fn(...args);
    console.log(`${name} returned`, result);
    return result;
  };
}

const loggedAdd = withLogging((a, b) => a + b, "add");
loggedAdd(3, 4);
// Calling add with [3, 4]
// add returned 7


// Once — ensures a function only runs one time
function once(fn) {
  let called = false;
  let result;

  return function(...args) {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

const initApp = once(() => {
  console.log("App initialized");
  return true;
});

initApp(); // "App initialized", returns true
initApp(); // returns true silently — doesn't run again
initApp(); // same
