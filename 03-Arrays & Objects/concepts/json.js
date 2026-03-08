// JSON — JavaScript Object Notation
// A text format for storing and transporting data.
// Looks like JS objects but with stricter rules:
//   - keys must be double-quoted strings
//   - no functions, undefined, symbols, or circular references
//   - no trailing commas


// --- JSON.stringify — JS value → JSON string ---

const user = {
  id: 1,
  name: "Alex",
  age: 28,
  active: true,
  tags: ["admin", "user"],
};

JSON.stringify(user);
// '{"id":1,"name":"Alex","age":28,"active":true,"tags":["admin","user"]}'

// Pretty print — second arg is replacer, third is indent
JSON.stringify(user, null, 2);
// {
//   "id": 1,
//   "name": "Alex",
//   ...
// }

// Replacer as array — only include these keys
JSON.stringify(user, ["name", "age"]);
// '{"name":"Alex","age":28}'

// Replacer as function — transform or exclude values
JSON.stringify(user, (key, value) => {
  if (key === "age") return undefined; // excluded
  return value;
});

// What gets dropped
JSON.stringify({
  fn:   function() {},  // dropped
  undef: undefined,     // dropped
  sym:  Symbol("x"),    // dropped
  date: new Date(),     // converted to ISO string
  num:  Infinity,       // becomes null
  nan:  NaN,            // becomes null
});


// --- JSON.parse — JSON string → JS value ---

const json = '{"name":"Alex","scores":[90,85,92]}';
const data = JSON.parse(json);

data.name;      // "Alex"
data.scores[0]; // 90

// Parse with a reviver function — transform values on the way in
const withDates = '{"name":"Alex","createdAt":"2024-01-15T10:00:00.000Z"}';
const parsed = JSON.parse(withDates, (key, value) => {
  if (key === "createdAt") return new Date(value);
  return value;
});
parsed.createdAt instanceof Date; // true


// --- Error handling ---

try {
  JSON.parse("not valid json");
} catch (err) {
  console.error("Parse failed:", err.message);
}

// Circular references throw
const circular = {};
circular.self = circular;
try {
  JSON.stringify(circular);
} catch (err) {
  console.error("Circular reference:", err.message);
}


// --- Practical patterns ---

// Deep clone (with limitations — see spread-rest-copies.js)
const original = { a: 1, nested: { b: 2 } };
const clone = JSON.parse(JSON.stringify(original));

// Save to localStorage
const settings = { theme: "dark", lang: "en" };
localStorage.setItem("settings", JSON.stringify(settings));
const loaded = JSON.parse(localStorage.getItem("settings") || "{}");

// Safe parse utility
function safeParseJSON(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

safeParseJSON('{"ok":true}');    // { ok: true }
safeParseJSON("not json", {});   // {}
