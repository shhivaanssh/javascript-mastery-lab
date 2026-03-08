// These exercises focus on immutable updates — the pattern used in React, Redux, and most modern JS.


// 1. Add an item to an array without mutating
const todos = [
  { id: 1, text: "Learn JS",    done: true  },
  { id: 2, text: "Build stuff", done: false },
];

function addTodo(list, text) {
  const id = Math.max(0, ...list.map(t => t.id)) + 1;
  return [...list, { id, text, done: false }];
}

const updated = addTodo(todos, "Ship it");
// original todos unchanged


// 2. Remove an item without mutating
function removeTodo(list, id) {
  return list.filter(t => t.id !== id);
}


// 3. Update a single item without mutating
function toggleTodo(list, id) {
  return list.map(t => t.id === id ? { ...t, done: !t.done } : t);
}

function updateTodo(list, id, changes) {
  return list.map(t => t.id === id ? { ...t, ...changes } : t);
}


// 4. Reorder — move item from one index to another
function moveItem(arr, fromIndex, toIndex) {
  const result = [...arr];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}

moveItem(["a", "b", "c", "d"], 0, 2); // ["b", "c", "a", "d"]


// 5. Update nested state immutably
const state = {
  user: {
    name: "Alex",
    prefs: { theme: "light", fontSize: 14 },
  },
  posts: [{ id: 1, title: "First post" }],
};

// Update nested theme
const newState = {
  ...state,
  user: {
    ...state.user,
    prefs: { ...state.user.prefs, theme: "dark" },
  },
};

console.log(state.user.prefs.theme);    // "light" — unchanged
console.log(newState.user.prefs.theme); // "dark"


// 6. Merge arrays of objects, deduplicating by id
function mergeById(existing, incoming) {
  const map = new Map(existing.map(item => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, { ...map.get(item.id), ...item });
  }
  return [...map.values()];
}

const old  = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
const fresh = [{ id: 2, name: "Bob Updated" }, { id: 3, name: "Carol" }];

mergeById(old, fresh);
// [{ id: 1, name: "Alice" }, { id: 2, name: "Bob Updated" }, { id: 3, name: "Carol" }]


// 7. Deep clone benchmarks — when to use what
const obj = { a: 1, b: { c: 2 }, d: [3, 4] };

// JSON — fast, works for plain data
const byJson      = JSON.parse(JSON.stringify(obj));

// structuredClone — handles more types (Date, Map, Set, RegExp, ArrayBuffer)
const byStructured = structuredClone(obj);

// Manual recursive — full control, handles edge cases
function deepClone(val) {
  if (val === null || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(deepClone);
  return Object.fromEntries(
    Object.entries(val).map(([k, v]) => [k, deepClone(v)])
  );
}

const byManual = deepClone(obj);
