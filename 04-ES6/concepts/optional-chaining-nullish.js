// These two features eliminate most of the "defensive coding" boilerplate
// that used to litter every JS codebase.


// --- Optional chaining (?.) ---
// Safely access nested properties without throwing if a middle value is null/undefined.
// Returns undefined instead of throwing TypeError.

const user = {
  name: "Alex",
  address: {
    city: "NYC",
    geo: { lat: 40.71, lng: -74.00 },
  },
  getEmail() { return "alex@example.com"; },
};

// Without optional chaining
user && user.address && user.address.city; // "NYC"

// With optional chaining
user?.address?.city;            // "NYC"
user?.profile?.avatar;          // undefined — no error
user?.address?.geo?.lat;        // 40.71


// On methods
user?.getEmail?.();             // "alex@example.com"
user?.sendMessage?.("hello");   // undefined — method doesn't exist, no error

// On arrays
const arr = [1, 2, 3];
arr?.[0];                       // 1
const maybeArr = null;
maybeArr?.[0];                  // undefined


// --- Nullish coalescing (??) ---
// Returns the right side only when the left side is null or undefined.
// Unlike ||, it does NOT trigger on 0, false, or "".

const config = {
  timeout: 0,
  retries: 0,
  verbose: false,
  label: "",
};

// || problem — treats 0, false, "" as falsy
config.timeout  || 3000; // 3000 — WRONG, 0 is a valid setting
config.verbose  || true;  // true  — WRONG
config.label    || "default"; // "default" — WRONG

// ?? fix
config.timeout  ?? 3000; // 0     — correct
config.verbose  ?? true;  // false — correct
config.label    ?? "default"; // "" — correct

// Only null/undefined trigger ??
null      ?? "fallback"; // "fallback"
undefined ?? "fallback"; // "fallback"
0         ?? "fallback"; // 0
false     ?? "fallback"; // false
""        ?? "fallback"; // ""


// --- Nullish assignment (??=) ---
// Assign only if the left side is null or undefined.

let cache = null;
cache ??= {};         // cache = {} (was null)

let count = 0;
count ??= 10;         // count stays 0 (not null/undefined)


// --- Logical assignment operators ---

let a = null;
a ||= "default";   // a = "default"  (assigns if falsy)

let b = 0;
b ??= 42;          // b = 0 (0 is not null/undefined)
b ||= 42;          // b = 42 (0 is falsy)

let c = { score: 5 };
c.score &&= c.score * 2; // c.score = 10 (assigns if truthy)


// --- Combining them ---

function getDisplayName(user) {
  return user?.profile?.displayName ?? user?.name ?? "Anonymous";
}

function getPort(config) {
  return config?.server?.port ?? 3000;
}

// Real API response handling
function processResponse(res) {
  const items = res?.data?.items ?? [];
  const total = res?.meta?.total ?? items.length;
  const page  = res?.meta?.page ?? 1;

  return { items, total, page };
}

processResponse(null);
// { items: [], total: 0, page: 1 }

processResponse({ data: { items: [1, 2, 3] }, meta: { total: 100, page: 2 } });
// { items: [1, 2, 3], total: 100, page: 2 }
