// 1. Invert an object — swap keys and values
function invertObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [v, k])
  );
}

invertObject({ a: 1, b: 2, c: 3 }); // { 1: "a", 2: "b", 3: "c" }


// 2. Deep merge two objects
function deepMerge(target, source) {
  const output = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] instanceof Object &&
      !Array.isArray(source[key]) &&
      key in target
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

const base    = { a: 1, b: { c: 2, d: 3 }, e: [1, 2] };
const updates = { b: { d: 99, f: 4 }, g: 5 };

deepMerge(base, updates);
// { a: 1, b: { c: 2, d: 99, f: 4 }, e: [1, 2], g: 5 }


// 3. Pick — return only selected keys
function pick(obj, keys) {
  return Object.fromEntries(
    keys.filter(k => k in obj).map(k => [k, obj[k]])
  );
}

const user = { id: 1, name: "Alex", password: "hash", email: "a@b.com" };
pick(user, ["id", "name", "email"]);
// { id: 1, name: "Alex", email: "a@b.com" }


// 4. Omit — return object without specified keys
function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k))
  );
}

omit(user, ["password"]); // { id: 1, name: "Alex", email: "a@b.com" }


// 5. Flatten a nested object
function flatten(obj, prefix = "", result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

flatten({ a: 1, b: { c: 2, d: { e: 3 } } });
// { "a": 1, "b.c": 2, "b.d.e": 3 }


// 6. Count occurrences in an array
function countBy(arr, keyFn = x => x) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

countBy(["apple", "banana", "apple", "cherry", "banana", "apple"]);
// { apple: 3, banana: 2, cherry: 1 }

countBy([1, 2, 3, 4, 5, 6], n => n % 2 === 0 ? "even" : "odd");
// { odd: 3, even: 3 }


// 7. Transform values of an object
function mapValues(obj, fn) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, fn(v, k)])
  );
}

mapValues({ a: 1, b: 2, c: 3 }, v => v * 10); // { a: 10, b: 20, c: 30 }
mapValues({ name: "  Alex  ", role: "  admin  " }, v => v.trim());


// 8. Diff two objects — show what changed
function diff(before, after) {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes = {};

  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = { from: before[key], to: after[key] };
    }
  }

  return changes;
}

diff(
  { name: "Alex", age: 28, city: "NYC" },
  { name: "Alex", age: 29, city: "LA"  }
);
// { age: { from: 28, to: 29 }, city: { from: "NYC", to: "LA" } }
