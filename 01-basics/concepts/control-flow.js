// --- if / else ---

const score = 72;

if (score >= 90) {
  console.log("A");
} else if (score >= 75) {
  console.log("B");
} else if (score >= 60) {
  console.log("C");
} else {
  console.log("F");
}


// --- Ternary ---

const age = 20;
const access = age >= 18 ? "allowed" : "denied";


// --- Nullish coalescing vs OR ---

const input = null;
const a = input ?? "default";  // "default" — only falls back on null/undefined
const b = input || "default";  // "default" — falls back on any falsy (0, "", false too)

const val = 0;
val ?? "fallback"; // 0     — 0 is not null/undefined
val || "fallback"; // "fallback" — 0 is falsy


// --- Optional chaining ---

const config = { db: { host: "localhost" } };
config.db?.host;      // "localhost"
config.cache?.host;   // undefined — no error thrown


// --- switch ---

const day = "Monday";

switch (day) {
  case "Saturday":
  case "Sunday":
    console.log("weekend");
    break;
  case "Monday":
    console.log("start of week");
    break;
  default:
    console.log("weekday");
}
// missing break causes fall-through to next case — usually a bug


// --- Logical operators for short-circuit ---

const isLoggedIn = true;
isLoggedIn && console.log("show dashboard"); // runs only if truthy

const theme = null;
const activeTheme = theme || "light"; // fallback

// short-circuit in assignments
let cache = null;
cache = cache ?? {};  // initialize only if null/undefined
