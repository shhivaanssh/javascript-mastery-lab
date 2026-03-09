# ES5 → ES6+ Refactor Diff

Every change made from `original-es5.js` to `refactored.js`, grouped by feature.

---

## `var` → `const` / `let`

| ES5 | ES6+ | Why |
|-----|------|-----|
| `var API_URL` | `const API_URL` | Never reassigned — const communicates that |
| `var i = 0` in for loop | Removed (loop replaced by array methods) | Block scope removes shadowing risk |
| `var role = user.role` | `const { role }` destructured | Shorter, scoped to block |

**Rule applied:** Default to `const`. Use `let` only when reassignment is needed. Never use `var`.

---

## Arrow functions

| ES5 | ES6+ | Why |
|-----|------|-----|
| `function(user) { return user.x }` | `user => user.x` | Shorter, implicit return |
| `function(a, b) { return a + b }` | `(a, b) => a + b` | Concise for pure functions |
| `fns.forEach(function(fn) { fn.apply(...) })` | `fns.forEach(fn => fn(...args))` | Arrow + spread replaces .apply |

**Note:** Arrow functions were NOT used for `EventEmitter` methods — object methods need their own `this`.

---

## Template literals

| ES5 | ES6+ | Why |
|-----|------|-----|
| `user.firstName + " " + user.lastName` | `` `${firstName} ${lastName}` `` | Readable, no concatenation bugs |
| `"<div>" + x + "</div>"` | `` `<div>${x}</div>` `` | Multi-line HTML is now readable |
| `"User " + id` | `` `User ${id}` `` | Any expression works inside `${}` |

---

## Destructuring

| ES5 | ES6+ | Why |
|-----|------|-----|
| `function(user) { user.firstName }` | `function({ firstName })` | Extracts what you need up front |
| `var key = keys[i]; result[key] = ...` | `const { role, ...user }` | Rest in destructuring replaces manual iteration |
| `Object.entries(params).map(function(pair) { pair[0] })` | `.map(([key, val]) =>)` | Array destructuring in params |

---

## Default parameters

| ES5 | ES6+ | Why |
|-----|------|-----|
| `if (symbol === undefined) symbol = "$"` | `(amount, symbol = "$")` | Intent is declared in the signature |
| `if (role === undefined) role = "user"` | `(firstName, ..., role = "user")` | Same — cleaner signature |

---

## Spread operator

| ES5 | ES6+ | Why |
|-----|------|-----|
| Manual `for` loop to copy object keys | `{ ...defaults, ...overrides }` | `mergeSettings` went from 10 lines to 1 |
| `Array.prototype.slice.call(arguments)` | `...args` (rest params) | Rest params are the modern replacement |
| `fn.apply(null, args)` | `fn(...args)` | Spread replaces `.apply` |

---

## Optional chaining and nullish coalescing

| ES5 | ES6+ | Why |
|-----|------|-----|
| `if (current === null \|\| current === undefined) return undefined` | `current?.[key]` | Optional chaining reduces the guard |
| `if (!groups[role]) groups[role] = []` | `groups[role] ??= []` | Nullish assignment is the exact right tool |
| `this.listeners[event] \|\| []` | `this.#listeners[event] ?? []` | `??` won't incorrectly ignore `0` or `false` |

---

## Class syntax

| ES5 | ES6+ | Why |
|-----|------|-----|
| `function EventEmitter() { this.listeners = {} }` | `class EventEmitter { #listeners = {} }` | Class syntax is declarative |
| `EventEmitter.prototype.on = function() {}` | `on(event, fn) {}` inside class | Methods live inside the class body |
| `this.listeners` (public) | `this.#listeners` (private field) | Private fields prevent external mutation |

---

## Async/Await

| ES5 | ES6+ | Why |
|-----|------|-----|
| Nested callbacks in `loadUserWithPosts` | `async/await` flat chain | Pyramid of doom → 3 readable lines |
| `callback(err, result)` convention | `Promise` / `throw` | Errors propagate naturally with try/catch |
| `if (err) return callback(err, null)` | Just `await` — errors bubble up | No manual error threading |

---

## ES Modules

| ES5 | ES6+ | Why |
|-----|------|-----|
| `module.exports = { ... }` | `export { ... }` | ESM is the standard — static, tree-shakeable |
| `require("./module")` | `import { fn } from "./module.js"` | Static imports enable bundle optimization |

---

## Summary: Lines changed

| Section | ES5 lines | ES6+ lines | Reduction |
|---------|-----------|------------|-----------|
| mergeSettings | 10 | 1 | -90% |
| getActiveUserNames | 6 | 3 | -50% |
| loadUserWithPosts | 8 | 4 | -50% |
| renderUserCard | 6 | 7 | +(readable) |
| EventEmitter | 22 | 18 | -18% |
| **Total** | **~120** | **~75** | **-37%** |

Less code isn't always better — but here, every reduction also improved clarity.
