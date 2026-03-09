// --- Map and Set challenges ---

// 1. Word frequency counter using Map
function wordFrequency(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return words.reduce((map, word) => {
    map.set(word, (map.get(word) ?? 0) + 1);
    return map;
  }, new Map());
}

const freq = wordFrequency("the quick brown fox jumps over the lazy dog the");
[...freq.entries()].sort((a, b) => b[1] - a[1]);
// [["the", 3], ["quick", 1], ...]


// 2. Two-sum using Map (O(n) instead of O(n²))
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return null;
}

twoSum([2, 7, 11, 15], 9);  // [0, 1]
twoSum([3, 2, 4], 6);       // [1, 2]


// 3. Find duplicates using Set
function findDuplicates(arr) {
  const seen = new Set();
  const dupes = new Set();
  for (const item of arr) {
    if (seen.has(item)) dupes.add(item);
    else seen.add(item);
  }
  return [...dupes];
}

findDuplicates([1, 2, 3, 2, 4, 3, 5]); // [2, 3]


// 4. Anagram grouping using Map
function groupAnagrams(words) {
  const groups = new Map();
  for (const word of words) {
    const key = word.toLowerCase().split("").sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}

groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]);
// [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]


// --- Generator challenges ---

// 5. Fibonacci generator
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

function take(n, gen) {
  const result = [];
  for (const val of gen) {
    result.push(val);
    if (result.length >= n) break;
  }
  return result;
}

take(10, fibonacci()); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]


// 6. Unique ID generator
function* idGenerator(prefix = "id", start = 1) {
  let n = start;
  while (true) {
    yield `${prefix}-${String(n++).padStart(4, "0")}`;
  }
}

const ids = idGenerator("user");
ids.next().value; // "user-0001"
ids.next().value; // "user-0002"
ids.next().value; // "user-0003"


// 7. Custom iterable linked list
class LinkedList {
  constructor() {
    this.head = null;
  }

  push(value) {
    this.head = { value, next: this.head };
    return this;
  }

  [Symbol.iterator]() {
    let node = this.head;
    return {
      next() {
        if (node) {
          const value = node.value;
          node = node.next;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const list = new LinkedList();
list.push(3).push(2).push(1);
[...list]; // [1, 2, 3]


// --- Symbol challenges ---

// 8. Make an object sortable via Symbol.toPrimitive
class Priority {
  constructor(level, label) {
    this.level = level;
    this.label = label;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.level;
    if (hint === "string") return `Priority(${this.label})`;
    return this.level;
  }
}

const priorities = [
  new Priority(3, "high"),
  new Priority(1, "low"),
  new Priority(2, "medium"),
];

priorities.sort((a, b) => b - a).map(p => `${p}`);
// ["Priority(high)", "Priority(medium)", "Priority(low)"]


// 9. Private-ish fields with Symbols (before # private fields)
const _balance = Symbol("balance");
const _pin     = Symbol("pin");

class BankAccount {
  constructor(initialBalance, pin) {
    this[_balance] = initialBalance;
    this[_pin]     = pin;
  }

  withdraw(amount, pin) {
    if (pin !== this[_pin]) return "wrong pin";
    if (amount > this[_balance]) return "insufficient funds";
    this[_balance] -= amount;
    return this[_balance];
  }

  get balance() { return this[_balance]; }
}

const account = new BankAccount(1000, 1234);
account.withdraw(200, 1234); // 800
account.withdraw(100, 9999); // "wrong pin"
// account[_balance] — only accessible if you have the symbol reference
