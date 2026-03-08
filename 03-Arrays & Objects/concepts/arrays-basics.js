// --- Creation ---

const empty   = [];
const nums    = [1, 2, 3, 4, 5];
const mixed   = [1, "two", true, null, { id: 3 }];

// Array constructor (rarely needed)
new Array(3);           // [empty × 3] — length 3, no values
Array.from({ length: 3 }, (_, i) => i + 1); // [1, 2, 3]
Array.of(1, 2, 3);      // [1, 2, 3]

// From iterables
Array.from("hello");    // ["h", "e", "l", "l", "o"]
Array.from(new Set([1, 2, 2, 3])); // [1, 2, 3]


// --- Indexing ---

const fruits = ["apple", "banana", "cherry", "date"];

fruits[0];        // "apple"
fruits[3];        // "date"
fruits[-1];       // undefined — JS doesn't support negative indexing natively
fruits.at(-1);    // "date"   — .at() supports negative indices
fruits.at(-2);    // "cherry"
fruits.length;    // 4

// Checking membership
fruits.includes("banana"); // true
fruits.indexOf("cherry");  // 2
fruits.indexOf("mango");   // -1 (not found)


// --- Mutation methods (change the original array) ---

const arr = [1, 2, 3];

arr.push(4);         // adds to end    → [1, 2, 3, 4], returns new length
arr.pop();           // removes from end → [1, 2, 3], returns removed item
arr.unshift(0);      // adds to start  → [0, 1, 2, 3], returns new length
arr.shift();         // removes from start → [1, 2, 3], returns removed item

// splice(startIndex, deleteCount, ...itemsToInsert)
const letters = ["a", "b", "c", "d", "e"];
letters.splice(1, 2);           // removes "b","c" → ["a", "d", "e"]
letters.splice(1, 0, "x", "y"); // insert at index 1 → ["a", "x", "y", "d", "e"]
letters.splice(2, 1, "z");      // replace index 2 → ["a", "x", "z", "d", "e"]

arr.reverse();  // reverses in place
arr.sort();     // sorts in place (alphabetical by default)
arr.sort((a, b) => a - b); // numeric ascending
arr.sort((a, b) => b - a); // numeric descending
arr.fill(0, 1, 3); // fill with 0 from index 1 to 3


// --- Non-mutating methods (return new array/value) ---

const original = [1, 2, 3, 4, 5];

// slice(start, end) — end not included
original.slice(1, 3);  // [2, 3]
original.slice(2);     // [3, 4, 5]
original.slice(-2);    // [4, 5]
// original unchanged

// concat
[1, 2].concat([3, 4], [5]); // [1, 2, 3, 4, 5]

// flat and flatMap
[[1, 2], [3, 4]].flat();         // [1, 2, 3, 4]
[1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4]
[1, 2, 3].flatMap(n => [n, n * 2]); // [1, 2, 2, 4, 3, 6]

// join
["a", "b", "c"].join("-"); // "a-b-c"
["a", "b", "c"].join("");  // "abc"

// indexOf / lastIndexOf / includes
[1, 2, 3, 2].indexOf(2);     // 1
[1, 2, 3, 2].lastIndexOf(2); // 3


// --- Spread to copy ---

const copy    = [...original];      // shallow copy
const merged  = [...[1, 2], ...[3, 4]]; // [1, 2, 3, 4]
const withNew = [...original, 6, 7];    // [1, 2, 3, 4, 5, 6, 7]
