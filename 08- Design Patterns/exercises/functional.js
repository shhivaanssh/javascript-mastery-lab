// ── 1. Pipe and compose ──

const pipe    = (...fns) => x => fns.reduce((v, f) => f(v), x);
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

// String transformers
const trim      = s => s.trim();
const lower     = s => s.toLowerCase();
const upper     = s => s.toUpperCase();
const words     = s => s.split(/\s+/);
const join      = sep => arr => arr.join(sep);
const replace   = (re, sub) => s => s.replace(re, sub);
const wrap      = (open, close) => s => `${open}${s}${close}`;
const truncate  = n => s => s.length > n ? s.slice(0, n) + "…" : s;

const toSlug    = pipe(trim, lower, replace(/\s+/g, "-"), replace(/[^a-z0-9-]/g, ""));
const toTitle   = pipe(trim, lower, words, join(" "), replace(/\b\w/g, c => c.toUpperCase()));
const toExcerpt = pipe(trim, truncate(100));

console.log(toSlug("  Hello World & Beyond!  ")); // "hello-world--beyond"
console.log(toTitle("the quick brown fox"));       // "The Quick Brown Fox"
console.log(toExcerpt("A ".repeat(60)));           // 100 chars + ellipsis


// ── 2. Auto-curry ──

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
}

// Build a curried data pipeline
const map      = curry((fn, arr) => arr.map(fn));
const filter   = curry((fn, arr) => arr.filter(fn));
const reduce   = curry((fn, seed, arr) => arr.reduce(fn, seed));
const prop     = curry((key, obj) => obj[key]);
const propEq   = curry((key, val, obj) => obj[key] === val);
const sortBy   = curry((key, arr) => [...arr].sort((a, b) => a[key] > b[key] ? 1 : -1));

const users = [
  { name: "Alice", age: 28, dept: "engineering", salary: 95000 },
  { name: "Bob",   age: 34, dept: "design",       salary: 80000 },
  { name: "Carol", age: 25, dept: "engineering", salary: 88000 },
  { name: "Dave",  age: 41, dept: "management",   salary: 120000 },
];

const getEngineers    = filter(propEq("dept", "engineering"));
const getNames        = map(prop("name"));
const totalSalary     = reduce((sum, u) => sum + u.salary, 0);
const byAge           = sortBy("age");

const engineerNames   = pipe(getEngineers, getNames)(users);
const totalPayroll    = pipe(getEngineers, totalSalary)(users);
const sorted          = byAge(users);

console.log(engineerNames); // ["Alice", "Carol"]
console.log(totalPayroll);  // 183000
console.log(sorted.map(prop("name"))); // youngest → oldest


// ── 3. Partial application ──

function partial(fn, ...preset) {
  return (...rest) => fn(...preset, ...rest);
}

// Build a configurable fetch wrapper
async function apiRequest(baseUrl, method, endpoint, data) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (data) options.body = JSON.stringify(data);
  const res = await fetch(`${baseUrl}${endpoint}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const myApi  = partial(apiRequest, "https://api.example.com");
const getReq = partial(myApi, "GET");
const postReq = partial(myApi, "POST");

// getReq("/users");
// postReq("/users", { name: "Alex" });

// Number formatting with partial
function formatNumber(locale, options, n) {
  return new Intl.NumberFormat(locale, options).format(n);
}

const usd = partial(formatNumber, "en-US", { style: "currency", currency: "USD" });
const eur = partial(formatNumber, "de-DE", { style: "currency", currency: "EUR" });
const pct = partial(formatNumber, "en-US", { style: "percent", minimumFractionDigits: 1 });

console.log(usd(1234.56));  // "$1,234.56"
console.log(eur(1234.56));  // "1.234,56 €"
console.log(pct(0.1234));   // "12.3%"


// ── 4. Maybe monad — safe property access chain ──

class Maybe {
  #value;
  constructor(v)       { this.#value = v; }
  static of(v)         { return new Maybe(v); }
  static empty()       { return new Maybe(null); }
  isNothing()          { return this.#value == null; }
  map(fn)              { return this.isNothing() ? this : Maybe.of(fn(this.#value)); }
  flatMap(fn)          { return this.isNothing() ? this : fn(this.#value); }
  getOrElse(fallback)  { return this.isNothing() ? fallback : this.#value; }
  filter(pred)         { return this.isNothing() || pred(this.#value) ? this : Maybe.empty(); }
  toString()           { return this.isNothing() ? "Nothing" : `Just(${this.#value})`; }
}

// Deeply nested API response — without Maybe you'd write 5 null checks
const response = {
  data: {
    user: {
      profile: {
        address: { city: "San Francisco" },
        preferences: { newsletter: true },
      },
    },
  },
};

const badResponse = { data: null };

const getCity = (res) =>
  Maybe.of(res)
    .map(r => r.data)
    .map(d => d.user)
    .map(u => u.profile)
    .map(p => p.address)
    .map(a => a.city)
    .getOrElse("Unknown city");

console.log(getCity(response));    // "San Francisco"
console.log(getCity(badResponse)); // "Unknown city"
console.log(getCity(null));        // "Unknown city"


// ── 5. Result monad — chainable error handling ──

class Result {
  #ok; #value; #error;
  constructor(ok, value, error) { this.#ok = ok; this.#value = value; this.#error = error; }
  static ok(v)    { return new Result(true,  v, null); }
  static err(e)   { return new Result(false, null, e); }
  isOk()          { return this.#ok; }
  map(fn)         { return this.#ok ? Result.ok(fn(this.#value)) : this; }
  flatMap(fn)     { return this.#ok ? fn(this.#value) : this; }
  mapErr(fn)      { return this.#ok ? this : Result.err(fn(this.#error)); }
  getOrElse(fb)   { return this.#ok ? this.#value : fb; }
  match({ ok, err }) { return this.#ok ? ok(this.#value) : err(this.#error); }
}

// Form validation pipeline
const parseEmail = (s) =>
  typeof s === "string" && s.includes("@")
    ? Result.ok(s.trim().toLowerCase())
    : Result.err("Invalid email address");

const parseAge = (n) =>
  typeof n === "number" && n >= 0 && n <= 150
    ? Result.ok(n)
    : Result.err("Age must be 0–150");

const parseUser = ({ email, age, name }) =>
  parseEmail(email)
    .flatMap(validEmail =>
      parseAge(age).map(validAge => ({
        name: name?.trim() || "Anonymous",
        email: validEmail,
        age: validAge,
      }))
    );

console.log(
  parseUser({ email: "alex@example.com", age: 30, name: "Alex" })
    .match({ ok: u => `✓ ${u.name} <${u.email}>`, err: e => `✗ ${e}` })
);
// ✓ Alex <alex@example.com>

console.log(
  parseUser({ email: "not-an-email", age: 30 })
    .match({ ok: u => `✓ ${u.name}`, err: e => `✗ ${e}` })
);
// ✗ Invalid email address
