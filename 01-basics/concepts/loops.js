// --- for ---

for (let i = 0; i < 5; i++) {
  console.log(i); // 0 1 2 3 4
}

// loop backwards
for (let i = 4; i >= 0; i--) {
  console.log(i);
}


// --- while ---

let n = 1;
while (n < 100) {
  n *= 2;
}
console.log(n); // 128 — first power of 2 over 100


// --- do...while — runs at least once ---

let attempts = 0;
do {
  attempts++;
} while (attempts < 3);


// --- for...of — for iterables (arrays, strings, sets) ---

const colors = ["red", "green", "blue"];
for (const color of colors) {
  console.log(color);
}

for (const char of "hello") {
  console.log(char); // h e l l o
}


// --- for...in — for object keys ---

const person = { name: "Alex", age: 30, city: "NYC" };
for (const key in person) {
  console.log(`${key}: ${person[key]}`);
}
// avoid for...in on arrays — use for...of or forEach instead


// --- break and continue ---

for (let i = 0; i < 10; i++) {
  if (i === 3) continue; // skip 3
  if (i === 7) break;    // stop at 7
  console.log(i);        // 0 1 2 4 5 6
}


// --- Nested loops ---

for (let row = 1; row <= 3; row++) {
  let line = "";
  for (let col = 1; col <= 3; col++) {
    line += `(${row},${col}) `;
  }
  console.log(line);
}


// --- Common patterns ---

// Sum all numbers
const nums = [1, 2, 3, 4, 5];
let sum = 0;
for (const n of nums) sum += n;

// Find first match
const words = ["apple", "banana", "cherry"];
let found = null;
for (const word of words) {
  if (word.startsWith("b")) {
    found = word;
    break;
  }
}
console.log(found); // "banana"
