// --- Spread in arrays ---

const a = [1, 2, 3];
const b = [4, 5, 6];

const combined = [...a, ...b];        // [1, 2, 3, 4, 5, 6]
const copy      = [...a];             // shallow copy
const prepended = [0, ...a];          // [0, 1, 2, 3]
const appended  = [...a, 4];          // [1, 2, 3, 4]
const inserted  = [...a.slice(0, 2), 99, ...a.slice(2)]; // [1, 2, 99, 3]

// Spread into function args
Math.max(...[3, 1, 4, 1, 5, 9]); // 9
console.log(...["a", "b", "c"]);  // a b c


// --- Spread in objects ---

const defaults = { theme: "light", lang: "en", debug: false };
const overrides = { theme: "dark" };

const config = { ...defaults, ...overrides };
// { theme: "dark", lang: "en", debug: false }
// later spread wins — overrides.theme overwrites defaults.theme

// Add/update a property without mutating
const user    = { id: 1, name: "Alex", role: "user" };
const updated = { ...user, role: "admin" };
const withAge = { ...user, age: 28 };

// Remove a property without mutating
const { role, ...withoutRole } = user;
// withoutRole = { id: 1, name: "Alex" }


// --- Rest parameters ---

function sum(...nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4, 5); // 15

function first(a, b, ...others) {
  console.log(a, b);    // first two
  console.log(others);  // the rest as array
}
first(1, 2, 3, 4, 5);


// --- Shallow vs deep copy ---

// Shallow copy — top level is copied, nested objects are still shared references
const original = {
  name: "Alex",
  scores: [90, 85, 92],
  address: { city: "NYC" },
};

const shallow = { ...original };
shallow.name = "Jordan";          // independent — doesn't affect original
shallow.scores.push(88);          // MUTATES original.scores — same reference
shallow.address.city = "LA";      // MUTATES original.address — same reference

console.log(original.scores);     // [90, 85, 92, 88] — changed!
console.log(original.address.city); // "LA" — changed!


// --- Deep copy options ---

// JSON approach — simple, but loses functions, undefined, Date, etc.
const deep1 = JSON.parse(JSON.stringify(original));
deep1.scores.push(100);
console.log(original.scores); // unchanged

// structuredClone — modern native deep copy (Node 17+, modern browsers)
const deep2 = structuredClone(original);
deep2.address.city = "Chicago";
console.log(original.address.city); // unchanged

// Limitations of structuredClone:
// - can't clone functions
// - can't clone class instances (loses prototype)
// - DOM nodes not supported


// --- Merging arrays of objects without duplicates ---

const list1 = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
const list2 = [{ id: 2, name: "Bob" },   { id: 3, name: "Carol" }];

const merged = [...new Map(
  [...list1, ...list2].map(item => [item.id, item])
).values()];
// [{ id: 1 }, { id: 2 }, { id: 3 }] — no duplicate id: 2
