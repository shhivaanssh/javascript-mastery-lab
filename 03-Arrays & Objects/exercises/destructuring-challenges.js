// 1. Swap without a temp variable
let x = 10, y = 20;
[x, y] = [y, x];
console.log(x, y); // 20 10


// 2. Pull values from a deeply nested API response
const apiResponse = {
  status: "ok",
  meta: { page: 2, perPage: 10, total: 47 },
  data: {
    user: {
      id: 99,
      profile: { displayName: "Alex J.", verified: true },
      preferences: { theme: "dark", notifications: false },
    },
  },
};

const {
  status,
  meta: { page, total },
  data: { user: { id: userId, profile: { displayName }, preferences: { theme } } },
} = apiResponse;

console.log(status, page, total, userId, displayName, theme);
// "ok" 2 47 99 "Alex J." "dark"


// 3. Function that returns multiple values cleanly
function analyzeText(text) {
  const words    = text.trim().split(/\s+/);
  const chars    = text.replace(/\s/g, "").length;
  const sentences = (text.match(/[.!?]+/g) || []).length;

  return { words: words.length, chars, sentences, longestWord: words.reduce((a, b) => a.length > b.length ? a : b) };
}

const { words, chars, longestWord } = analyzeText("The quick brown fox jumps.");
console.log(words, chars, longestWord); // 5 18 "jumps"


// 4. Extract first and last from array with destructuring
const scores = [88, 92, 71, 95, 83];
const [first, ...middle] = scores;
const last = scores.at(-1);

console.log(first, last); // 88 83


// 5. Rename conflicting imports — simulate with object destructuring
const moduleA = { format: (d) => `A: ${d}`, parse: (s) => s.trim() };
const moduleB = { format: (d) => `B: ${d}`, parse: (s) => s.toLowerCase() };

const { format: formatA, parse: parseA } = moduleA;
const { format: formatB, parse: parseB } = moduleB;

formatA("date"); // "A: date"
formatB("date"); // "B: date"


// 6. Default values in function params
function createUser({ name, role = "user", active = true, score = 0 } = {}) {
  return { name, role, active, score, createdAt: new Date().toISOString() };
}

createUser({ name: "Alex", role: "admin" });
// { name: "Alex", role: "admin", active: true, score: 0, createdAt: "..." }

createUser({ name: "Jordan" });
// { name: "Jordan", role: "user", active: true, score: 0, createdAt: "..." }


// 7. Process a list of coordinate pairs
const coords = [[40.7128, -74.0060], [34.0522, -118.2437], [51.5074, -0.1278]];
const cities = ["New York", "Los Angeles", "London"];

const locations = coords.map(([lat, lng], i) => ({
  name: cities[i],
  lat,
  lng,
  hemisphere: lat >= 0 ? "N" : "S",
}));
console.log(locations);


// 8. Destructure in a for..of loop
const inventory = [
  { product: "Keyboard", qty: 14, price: 80 },
  { product: "Mouse",    qty: 0,  price: 45 },
  { product: "Monitor",  qty: 5,  price: 320 },
];

for (const { product, qty, price } of inventory) {
  if (qty === 0) {
    console.log(`${product} — OUT OF STOCK`);
  } else {
    console.log(`${product} — ${qty} left @ $${price}`);
  }
}
