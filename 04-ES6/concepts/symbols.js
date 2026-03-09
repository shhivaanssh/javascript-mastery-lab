// Symbol is a primitive type that produces a guaranteed unique value.
// No two symbols are ever equal, even with the same description.


// --- Creating symbols ---

const id  = Symbol("id");
const key = Symbol("id"); // same description

id === key; // false — always unique
typeof id;  // "symbol"
id.toString();   // "Symbol(id)"
id.description;  // "id"


// --- Symbol as unique object key ---
// Symbols don't show up in for...in, Object.keys(), or JSON.stringify.
// That makes them useful for "hidden" properties.

const SECRET = Symbol("secret");
const ID     = Symbol("id");

const user = {
  name: "Alex",
  [ID]: 12345,
  [SECRET]: "s3cr3t",
};

user[ID];       // 12345
user[SECRET];   // "s3cr3t"

Object.keys(user);           // ["name"] — symbols excluded
JSON.stringify(user);        // '{"name":"Alex"}' — symbols excluded
for (const k in user) { }   // only "name"

// To get symbol keys:
Object.getOwnPropertySymbols(user); // [Symbol(id), Symbol(secret)]


// --- Prevent property name collisions ---
// Useful when multiple libraries or modules add metadata to the same object

// lib-a.js
const LIB_A_META = Symbol("meta");
obj[LIB_A_META] = { version: 1 };

// lib-b.js
const LIB_B_META = Symbol("meta");
obj[LIB_B_META] = { theme: "dark" };

// Both coexist — same description, different symbols, no collision


// --- Symbol.for — global symbol registry ---
// Symbol.for() creates or retrieves a symbol by key from a global registry.
// Two calls with the same key return the same symbol.

const s1 = Symbol.for("shared");
const s2 = Symbol.for("shared");
s1 === s2; // true — same registry entry

Symbol.keyFor(s1); // "shared"
Symbol.keyFor(Symbol("local")); // undefined — not in registry


// --- Well-known symbols ---
// JS uses built-in symbols to let you hook into language behavior.

// Symbol.iterator — make any object iterable
class Range {
  constructor(start, end) {
    this.start = start;
    this.end   = end;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const end   = this.end;

    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const range = new Range(1, 5);
[...range];              // [1, 2, 3, 4, 5]
for (const n of range) console.log(n); // 1 2 3 4 5


// Symbol.toPrimitive — control type coercion
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.celsius;
    if (hint === "string") return `${this.celsius}°C`;
    return this.celsius; // default
  }
}

const temp = new Temperature(22);
+temp;          // 22
`${temp}`;      // "22°C"
temp + 0;       // 22


// Symbol.hasInstance — control instanceof behavior
class EvenNumber {
  static [Symbol.hasInstance](n) {
    return typeof n === "number" && n % 2 === 0;
  }
}

2 instanceof EvenNumber; // true
3 instanceof EvenNumber; // false


// Symbol.toStringTag — customize Object.prototype.toString output
class Queue {
  get [Symbol.toStringTag]() {
    return "Queue";
  }
}

Object.prototype.toString.call(new Queue()); // "[object Queue]"
