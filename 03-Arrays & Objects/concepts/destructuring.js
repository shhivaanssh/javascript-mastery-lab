// --- Array destructuring ---

const rgb = [255, 128, 0];

const [r, g, b] = rgb;
// r = 255, g = 128, b = 0

// Skip elements
const [first, , third] = [1, 2, 3];
// first = 1, third = 3

// Rest element
const [head, ...tail] = [1, 2, 3, 4, 5];
// head = 1, tail = [2, 3, 4, 5]

// Default values
const [x = 0, y = 0, z = 0] = [10, 20];
// x = 10, y = 20, z = 0

// Swap variables
let a = 1, bv = 2;
[a, bv] = [bv, a];
// a = 2, bv = 1

// From function return
function getMinMax(arr) {
  return [Math.min(...arr), Math.max(...arr)];
}
const [min, max] = getMinMax([3, 1, 4, 1, 5, 9]);
// min = 1, max = 9


// --- Object destructuring ---

const user = {
  id: 1,
  name: "Alex",
  age: 28,
  role: "admin",
  address: { city: "NYC", zip: "10001" },
};

const { name, age } = user;

// Rename while destructuring
const { name: username, role: userRole } = user;

// Default values
const { name: n, score = 0 } = user;
// n = "Alex", score = 0 (not on user)

// Nested destructuring
const { address: { city, zip } } = user;
// city = "NYC", zip = "10001"

// Rest in objects
const { id, ...rest } = user;
// id = 1, rest = { name, age, role, address }

// Rename + default at once
const { timeout: ms = 3000 } = {};
// ms = 3000


// --- In function parameters ---

// Instead of accessing config.host, config.port, etc.
function connect({ host = "localhost", port = 3000, ssl = false } = {}) {
  return `${ssl ? "https" : "http"}://${host}:${port}`;
}

connect({ host: "example.com", ssl: true }); // "https://example.com:3000"
connect();                                    // "http://localhost:3000"

// Array params
function first3([a, b, c]) {
  return [a, b, c];
}


// --- Nested + complex ---

const response = {
  status: 200,
  data: {
    users: [
      { id: 1, name: "Alex",   tags: ["admin", "user"] },
      { id: 2, name: "Jordan", tags: ["user"] },
    ],
    total: 2,
  },
};

const { data: { users, total }, status } = response;
const [{ name: firstName, tags: [firstTag] }] = users;
// firstName = "Alex", firstTag = "admin"


// --- In loops ---

const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];

for (const { x, y } of points) {
  console.log(`(${x}, ${y})`);
}

Object.entries({ a: 1, b: 2, c: 3 }).forEach(([key, val]) => {
  console.log(`${key} = ${val}`);
});
