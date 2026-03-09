// ============================================================
// ES6+ REFACTORED VERSION
// Each change is annotated with the feature used.
// Compare with original-es5.js to see every difference.
// ============================================================


// 1. Variable declarations
// CHANGE: var → const (these never get reassigned)
const API_URL    = "https://api.example.com";
const MAX_RETRIES = 3;
const appConfig  = { debug: false, timeout: 5000, version: "1.0.0" };


// 2. Utility functions
// CHANGE: function declaration → arrow function
// CHANGE: string concat → template literal
// CHANGE: undefined check → default parameter
const getUserFullName = ({ firstName, lastName }) =>
  `${firstName} ${lastName}`;
// BONUS: destructured the `user` parameter directly

const formatCurrency = (amount, symbol = "$") =>
  `${symbol}${amount.toFixed(2)}`;
// CHANGE: default parameter replaces manual `if (symbol === undefined)`

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);


// 3. Array processing
// CHANGE: function(x) {} callbacks → arrow functions
// CHANGE: string concat inside map → template literal
const getActiveUserNames = (users) =>
  users
    .filter(({ active }) => active)
    .map(({ firstName, lastName }) => `${firstName} ${lastName}`);
// BONUS: destructuring in the arrow function parameters

const groupUsersByRole = (users) =>
  users.reduce((groups, { role, ...user }) => ({
    ...groups,
    [role]: [...(groups[role] ?? []), { role, ...user }],
  }), {});
// CHANGE: computed property [role], spread, nullish coalescing

const getTotalRevenue = (orders) =>
  orders.reduce((total, { quantity, price }) => total + quantity * price, 0);
// BONUS: destructured order params


// 4. Object manipulation
// CHANGE: undefined check → default parameter
// CHANGE: string concat → template literal
// CHANGE: manual key assignment → property shorthand + spread
const createUser = (firstName, lastName, email, role = "user") => ({
  firstName,
  lastName,
  email,
  role,
  fullName: `${firstName} ${lastName}`,
  createdAt: new Date().toISOString(),
});
// CHANGE: all values use shorthand (firstName: firstName → firstName)

// CHANGE: for loops with Object.keys → spread operator
const mergeSettings = (defaults, overrides) => ({ ...defaults, ...overrides });
// 3 lines of ES5 replaced by 1 with object spread

// CHANGE: for loop + manual null check → optional chaining
const getNestedValue = (obj, path) =>
  path.split(".").reduce((current, key) => current?.[key], obj);
// optional chaining (?.) replaces the manual null check in the loop


// 5. Class syntax
// CHANGE: constructor function + prototype → class
class EventEmitter {
  #listeners = {};
  // BONUS: private field (ES2022) replaces this.listeners

  on(event, fn) {
    this.#listeners[event] ??= [];
    // CHANGE: if (!x) x = [] → nullish assignment (??=)
    this.#listeners[event].push(fn);
    return this;
  }

  emit(event, ...args) {
    // CHANGE: Array.prototype.slice.call(arguments) → rest params
    // CHANGE: fn.apply(null, args) → fn(...args)
    (this.#listeners[event] ?? []).forEach(fn => fn(...args));
    return this;
  }

  off(event, fn) {
    if (!this.#listeners[event]) return this;
    this.#listeners[event] = this.#listeners[event].filter(l => l !== fn);
    return this;
  }
}


// 6. Async — callbacks → Promises → async/await
// CHANGE: callback-style → Promise-based → async/await

function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) reject(new Error("Invalid ID"));
      else resolve({ id, name: `User ${id}` });
      // CHANGE: string concat → template literal
      // CHANGE: { id: id } → { id } (shorthand)
    }, 100);
  });
}

function fetchUserPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, userId, title: "Post 1" },
        { id: 2, userId, title: "Post 2" },
      ]);
    }, 100);
  });
}

// CHANGE: callback hell → async/await — flat, readable, no nesting
async function loadUserWithPosts(userId) {
  const user  = await fetchUser(userId);
  const posts = await fetchUserPosts(user.id);
  return { user, posts };
  // errors propagate as thrown exceptions — catch at the call site
}


// 7. String building
// CHANGE: for loop + string concat → Object.entries + template literals
const buildQueryString = (params) =>
  "?" + Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");
// BONUS: destructured [key, val] in the map callback

// CHANGE: string concat → multi-line template literal
const renderUserCard = ({ firstName, lastName, email, role }) => `
  <div class="user-card">
    <h2>${firstName} ${lastName}</h2>
    <p>${email}</p>
    <span class="role">${role}</span>
  </div>
`.trim();
// BONUS: destructured user params directly


export {
  API_URL, MAX_RETRIES, appConfig,
  getUserFullName, formatCurrency, clamp,
  getActiveUserNames, groupUsersByRole, getTotalRevenue,
  createUser, mergeSettings, getNestedValue,
  EventEmitter,
  fetchUser, fetchUserPosts, loadUserWithPosts,
  buildQueryString, renderUserCard,
};
// CHANGE: module.exports = { ... } → named ESM exports
