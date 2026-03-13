// Functional patterns treat computation as the evaluation of
// mathematical functions. They avoid shared state and mutable data.


// ════════════════════════════════════════════════════════
// COMPOSITION
// Build complex behaviour by combining simple functions.
// f(g(x)) — the output of one function feeds the next.
// ════════════════════════════════════════════════════════

// compose — right to left (mathematical order)
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);

// pipe — left to right (reading order, preferred)
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

// Basic transformers
const trim        = s => s.trim();
const lowercase   = s => s.toLowerCase();
const capitalize  = s => s.charAt(0).toUpperCase() + s.slice(1);
const removeSpaces = s => s.replace(/\s+/g, "_");
const addPrefix   = prefix => s => `${prefix}_${s}`;

const toSlug = pipe(trim, lowercase, removeSpaces);
const toKey  = pipe(trim, lowercase, removeSpaces, addPrefix("key"));

toSlug("  Hello World  "); // "hello_world"
toKey("  My Setting  ");   // "key_my_setting"

// Async pipe
const pipeAsync = (...fns) => x => fns.reduce((p, fn) => p.then(fn), Promise.resolve(x));

const processUser = pipeAsync(
  id   => fetch(`/api/users/${id}`).then(r => r.json()),
  user => fetch(`/api/teams/${user.teamId}`).then(r => r.json()),
  team => ({ ...team, memberCount: team.members?.length ?? 0 }),
);


// ════════════════════════════════════════════════════════
// CURRYING
// Transform a function with multiple arguments into a
// sequence of functions, each taking one argument.
// ════════════════════════════════════════════════════════

// Manual curry
const add    = a => b => a + b;
const add10  = add(10);
add10(5);  // 15
add10(20); // 30

// Auto-curry utility
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return function(...more) { return curried(...args, ...more); };
  };
}

const multiply   = curry((a, b, c) => a * b * c);
const double     = multiply(2);
const triple     = multiply(3);
const sextuple   = multiply(2)(3);

double(5);    // 10
triple(5);    // 15
sextuple(5);  // 30
multiply(2, 3, 5); // 30 — can still call all at once


// Practical currying
const get    = curry((key, obj)       => obj[key]);
const set    = curry((key, val, obj)  => ({ ...obj, [key]: val }));
const has    = curry((key, obj)       => key in obj);
const filter = curry((pred, arr)      => arr.filter(pred));
const map    = curry((fn, arr)        => arr.map(fn));
const reduce = curry((fn, init, arr)  => arr.reduce(fn, init));

const getName   = get("name");
const getEmails = map(get("email"));
const actives   = filter(get("active"));

const users = [
  { name: "Alex", email: "a@x.com", active: true  },
  { name: "Jo",   email: "j@x.com", active: false },
  { name: "Sam",  email: "s@x.com", active: true  },
];

getEmails(actives(users)); // ["a@x.com", "s@x.com"]


// ════════════════════════════════════════════════════════
// PARTIAL APPLICATION
// Fix some arguments of a function, producing a new function
// of smaller arity.
// ════════════════════════════════════════════════════════

function partial(fn, ...preset) {
  return function(...rest) {
    return fn.apply(this, [...preset, ...rest]);
  };
}

function request(baseUrl, method, path, data) {
  return fetch(`${baseUrl}${path}`, {
    method,
    body: data ? JSON.stringify(data) : undefined,
  });
}

const api    = partial(request, "https://api.example.com");
const get2   = partial(api, "GET");
const post   = partial(api, "POST");

get2("/users");            // GET https://api.example.com/users
post("/users", { name: "Alex" }); // POST with body

// Placeholder partial — fix specific arguments, not just the first N
const _ = Symbol("placeholder");

function partialWith(fn, ...args) {
  return function(...rest) {
    const resolved = args.map(a => a === _ ? rest.shift() : a);
    return fn.apply(this, [...resolved, ...rest]);
  };
}

const divide    = (a, b) => a / b;
const half      = partialWith(divide, _, 2); // first arg is the placeholder
const reciprocal = partialWith(divide, 1);    // first arg fixed to 1

half(10);      // 5
half(20);      // 10
reciprocal(4); // 0.25


// ════════════════════════════════════════════════════════
// MONAD PATTERN (Maybe / Result)
// Wrap values in a context that handles edge cases
// (null, errors) without if/else chains.
// ════════════════════════════════════════════════════════

// Maybe monad — handles null/undefined safely
class Maybe {
  #value;
  constructor(value) { this.#value = value; }

  static of(value)    { return new Maybe(value); }
  static empty()      { return new Maybe(null); }

  isNothing()         { return this.#value == null; }
  get value()         { return this.#value; }

  map(fn) {
    return this.isNothing() ? this : Maybe.of(fn(this.#value));
  }

  flatMap(fn) {
    return this.isNothing() ? this : fn(this.#value);
  }

  getOrElse(fallback) {
    return this.isNothing() ? fallback : this.#value;
  }

  tap(fn) {
    if (!this.isNothing()) fn(this.#value);
    return this;
  }
}

// No more null checks scattered everywhere
const getUser  = (id)   => Maybe.of(id === 1 ? { name: "Alex", address: { city: "NYC" } } : null);
const getCity  = (user) => Maybe.of(user.address?.city);

const city = getUser(1)
  .flatMap(getCity)
  .map(c => c.toUpperCase())
  .getOrElse("Unknown");

console.log(city); // "NYC"

const city2 = getUser(999)
  .flatMap(getCity)
  .map(c => c.toUpperCase())
  .getOrElse("Unknown");

console.log(city2); // "Unknown" — no errors, no null checks


// Result monad — handles success/failure
class Result {
  #value; #error; #isOk;

  constructor(ok, value, error) { this.#isOk = ok; this.#value = value; this.#error = error; }

  static ok(value)    { return new Result(true,  value, null); }
  static err(error)   { return new Result(false, null,  error); }

  isOk()  { return this.#isOk; }
  isErr() { return !this.#isOk; }

  map(fn) {
    return this.#isOk ? Result.ok(fn(this.#value)) : this;
  }

  mapErr(fn) {
    return this.#isOk ? this : Result.err(fn(this.#error));
  }

  flatMap(fn) {
    return this.#isOk ? fn(this.#value) : this;
  }

  match({ ok, err }) {
    return this.#isOk ? ok(this.#value) : err(this.#error);
  }
}

function parseAge(input) {
  const n = Number(input);
  if (isNaN(n))  return Result.err("Not a number");
  if (n < 0)     return Result.err("Age can't be negative");
  if (n > 150)   return Result.err("Unrealistic age");
  return Result.ok(n);
}

parseAge("25").match({ ok: v => console.log("age:", v), err: e => console.log("error:", e) });
parseAge("abc").match({ ok: v => console.log(v), err: e => console.log("error:", e) });
