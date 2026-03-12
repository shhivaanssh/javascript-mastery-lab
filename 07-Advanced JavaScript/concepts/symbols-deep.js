// Symbols are unique, immutable primitive values used as property keys.
// Two Symbols created with the same description are never equal.
// They're invisible to most iteration and JSON serialization — intentionally private.


// ── Creating Symbols ──

const id1 = Symbol("id");
const id2 = Symbol("id");
id1 === id2; // false — always unique, description is just a label

typeof id1;        // "symbol"
id1.toString();    // "Symbol(id)"
id1.description;   // "id"


// ── Symbols as object keys ──

const USER_ID   = Symbol("userId");
const LAST_SEEN = Symbol("lastSeen");

const user = {
  name: "Alex",
  [USER_ID]:   42,
  [LAST_SEEN]: new Date(),
};

user[USER_ID];   // 42 — access with the exact Symbol reference
user["userId"];  // undefined — strings and Symbols are different key types

// Symbols don't appear in normal enumeration
Object.keys(user);            // ["name"]
Object.values(user);          // ["Alex"]
JSON.stringify(user);         // '{"name":"Alex"}' — Symbols silently dropped
for (const k in user) console.log(k); // "name" only

// But they're not truly hidden — you can retrieve them
Object.getOwnPropertySymbols(user); // [Symbol(userId), Symbol(lastSeen)]
Reflect.ownKeys(user);              // ["name", Symbol(userId), Symbol(lastSeen)]


// ── Symbol.for — global registry ──

// Symbol.for looks up or creates a symbol in a global registry by key.
// Same key → same Symbol, even across different files/modules.

const s1 = Symbol.for("app.token");
const s2 = Symbol.for("app.token");
s1 === s2; // true

Symbol.keyFor(s1); // "app.token" — reverse lookup
Symbol.keyFor(Symbol("local")); // undefined — not in registry


// ── Well-known Symbols — hooks into JS engine behaviour ──

// Symbol.iterator — make any object iterable
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
    };
  }
}

const range = new Range(1, 10, 2);
[...range];                  // [1, 3, 5, 7, 9]
for (const n of range) {}    // works
const [first, , third] = range; // destructuring works


// Symbol.toPrimitive — control coercion to primitives
class Temperature {
  constructor(celsius) { this.celsius = celsius; }

  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.celsius;
    if (hint === "string") return `${this.celsius}°C`;
    return this.celsius; // "default" hint
  }
}

const temp = new Temperature(100);
+temp;             // 100 (number coercion)
`Temp: ${temp}`;   // "Temp: 100°C" (string coercion)
temp + 0;          // 100 (default → number)


// Symbol.hasInstance — control instanceof behaviour
class EvenNumber {
  static [Symbol.hasInstance](num) {
    return Number.isInteger(num) && num % 2 === 0;
  }
}

2 instanceof EvenNumber; // true
3 instanceof EvenNumber; // false
4 instanceof EvenNumber; // true


// Symbol.toStringTag — control Object.prototype.toString output
class APIResponse {
  get [Symbol.toStringTag]() { return "APIResponse"; }
}

Object.prototype.toString.call(new APIResponse()); // "[object APIResponse]"


// Symbol.species — define which constructor derived objects use
class PowerArray extends Array {
  static get [Symbol.species]() { return Array; } // map/filter return plain Array
}

const pa  = new PowerArray(1, 2, 3);
const mapped = pa.map(x => x * 2);
mapped instanceof PowerArray; // false — plain Array due to Symbol.species
mapped instanceof Array;      // true


// ── Practical: type-safe event bus with Symbol keys ──

const EVENTS = {
  USER_LOGGED_IN:  Symbol("user:login"),
  USER_LOGGED_OUT: Symbol("user:logout"),
  DATA_LOADED:     Symbol("data:loaded"),
};

class EventBus {
  #listeners = new Map();

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(fn);
    return () => this.#listeners.get(event).delete(fn); // returns unsubscribe fn
  }

  emit(event, data) {
    this.#listeners.get(event)?.forEach(fn => fn(data));
  }
}

const bus = new EventBus();
const off = bus.on(EVENTS.USER_LOGGED_IN, ({ name }) => console.log(`Welcome, ${name}`));
bus.emit(EVENTS.USER_LOGGED_IN, { name: "Alex" }); // "Welcome, Alex"
off(); // remove listener
