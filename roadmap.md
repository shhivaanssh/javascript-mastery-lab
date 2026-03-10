# 🗺️ JavaScript Learning Roadmap

> A complete, ordered curriculum from JavaScript fundamentals to full-stack backend engineering.
> Each phase builds directly on the last. No shortcuts.

**Legend:** ✅ Complete · 🔄 In Progress · ⏳ Upcoming · 🔒 Locked (prerequisite incomplete)

---

## Phase 1 — JavaScript Foundations
*Goal: Think in JavaScript. Understand how the language works, not just how to use it.*

### Module 01 — Basics `✅ Complete`
- [ ] Variables: `var`, `let`, `const` — scoping differences
- [ ] Primitive types: string, number, boolean, null, undefined, symbol, bigint
- [ ] Type coercion and `typeof`
- [ ] Operators: arithmetic, comparison, logical, ternary
- [ ] Template literals
- [ ] Conditionals: `if/else`, `switch`
- [ ] Loops: `for`, `while`, `do...while`, `for...of`, `for...in`

**Mini Project:** `simple-calculator.js` — CLI calculator with all four operations

---

### Module 02 — Functions & Scope `✅ Complete`
- [ ] Function declarations vs expressions
- [ ] Arrow functions and lexical `this`
- [ ] Parameters, arguments, default values, rest parameters
- [ ] First-class functions and higher-order functions
- [ ] Hoisting — what it is and why it matters
- [ ] Scope: global, function, block
- [ ] The scope chain
- [ ] Closures — definition, use cases, data privacy
- [ ] IIFE (Immediately Invoked Function Expressions)
- [ ] The call stack

**Mini Project:** `function-playground/` — closure counter, memoize, compose utilities

---

### Module 03 — Arrays & Objects `✅ Complete`
- [ ] Array creation, indexing, mutation
- [ ] Core methods: `push`, `pop`, `shift`, `unshift`, `splice`, `slice`
- [ ] Iteration methods: `forEach`, `map`, `filter`, `reduce`, `find`, `some`, `every`
- [ ] Array destructuring
- [ ] Object literals, properties, methods
- [ ] Property shorthand, computed properties
- [ ] Object destructuring
- [ ] Spread and rest operators (`...`)
- [ ] Shallow vs deep copy
- [ ] `JSON.stringify` and `JSON.parse`

**Mini Project:** `data-transformer/` — transform and analyze a dataset using array methods only

---

### Module 04 — ES6+ Modern JavaScript `✅ Complete`
- [ ] `let`/`const` (revisited with context)
- [ ] Arrow functions (deep dive)
- [ ] Template literals and tagged templates
- [ ] Destructuring (arrays and objects, nested)
- [ ] Spread / rest operators
- [ ] Default parameters
- [ ] Modules: `import` / `export` (ESM)
- [ ] Optional chaining (`?.`) and nullish coalescing (`??`)
- [ ] `Map` and `Set`
- [ ] `WeakMap` and `WeakSet`
- [ ] Symbols
- [ ] Iterators and `for...of`
- [ ] Generators (intro)

**Mini Project:** `modern-syntax-lab/` — refactor ES5 code to modern JS and annotate every change

---

## Phase 2 — Asynchronous JavaScript
*Goal: Understand how JavaScript handles time. This is where most developers get stuck.*

### Module 05 — Asynchronous JavaScript `✅ Complete`
- [ ] Synchronous vs asynchronous execution
- [ ] The event loop — call stack, task queue, microtask queue
- [ ] Callbacks — basics and callback hell
- [ ] Promises — creation, `.then()`, `.catch()`, `.finally()`
- [ ] Promise chaining
- [ ] `Promise.all`, `Promise.race`, `Promise.allSettled`, `Promise.any`
- [ ] `async` / `await` — syntax and mental model
- [ ] Error handling with `try/catch` in async functions
- [ ] `fetch` API — making HTTP requests
- [ ] `AbortController` and request cancellation

**Mini Project:** `async-weather-app/` — fetch live weather data, handle loading/error states

---

## Phase 3 — The Browser
*Goal: Understand JavaScript's relationship with HTML, CSS, and the browser environment.*

### Module 06 — DOM & Browser APIs `⏳`
- [ ] The DOM — what it is and how to think about it
- [ ] Selecting elements: `querySelector`, `getElementById`, etc.
- [ ] Creating, modifying, removing DOM elements
- [ ] Events — `addEventListener`, event object, event types
- [ ] Event bubbling and capturing
- [ ] Event delegation
- [ ] Local Storage, Session Storage
- [ ] `setTimeout`, `setInterval`, `requestAnimationFrame`
- [ ] Form handling and validation
- [ ] The History and URL APIs

**Mini Project:** `markdown-previewer/` — live HTML preview of markdown typed in a textarea

---

## Phase 4 — Deep JavaScript
*Goal: Understand the engine. Write code that is correct because you understand why.*

### Module 07 — Advanced JavaScript `⏳`
- [ ] `this` — all binding rules (default, implicit, explicit, `new`, arrow)
- [ ] `call`, `apply`, `bind`
- [ ] Prototypes and the prototype chain
- [ ] `Object.create`, `Object.assign`, `Object.keys/values/entries`
- [ ] Classes — syntax, inheritance, `super`, static methods
- [ ] Getters and setters
- [ ] Symbols (deep dive)
- [ ] Iterators and the iteration protocol
- [ ] Generators — `function*`, `yield`
- [ ] Proxies and Reflect
- [ ] WeakRef and FinalizationRegistry
- [ ] Memory management and garbage collection basics

**Mini Project:** `custom-observable/` — build a simplified reactive observable from scratch

---

### Module 08 — Design Patterns `⏳`
- [ ] Why patterns matter — shared vocabulary, proven solutions
- [ ] Creational: Singleton, Factory, Builder
- [ ] Structural: Module, Decorator, Facade, Proxy
- [ ] Behavioral: Observer, Strategy, Command, Iterator
- [ ] Functional patterns: Composition, Currying, Partial Application
- [ ] Anti-patterns to avoid

**Mini Project:** `pattern-library/` — implement each pattern with a real use-case example

---

## Phase 5 — Node.js & Backend
*Goal: Take JavaScript to the server. Build real networked applications.*

### Module 09 — Node.js Basics `⏳`
- [ ] What Node.js is — V8, libuv, event loop differences from browser
- [ ] Modules: CommonJS vs ESM in Node
- [ ] The `fs` module — reading, writing, watching files
- [ ] The `path` module
- [ ] `process` object and environment variables
- [ ] Streams and buffers
- [ ] Events module and `EventEmitter`
- [ ] The `http` module — create a basic server from scratch
- [ ] npm — managing dependencies, `package.json`, scripts
- [ ] Debugging Node.js applications

**Mini Project:** `file-system-cli/` — a CLI tool to organize, search, and tag local files

---

### Module 10 — API Development `⏳`
- [ ] HTTP fundamentals — methods, status codes, headers
- [ ] REST principles and API design
- [ ] Building a REST API without frameworks (raw `http` module)
- [ ] Introduction to Express.js — routing, middleware, error handling
- [ ] Request validation
- [ ] Authentication — sessions vs JWT
- [ ] Environment variables and config management
- [ ] Connecting to a database (SQLite → PostgreSQL)
- [ ] API error handling patterns
- [ ] Testing APIs with curl and tools like Thunder Client

**Real-World Project:** `habit-tracker-api/` — full REST API with auth, streaks, stats

---

## Phase 6 — Real-World Engineering
*Goal: Build things that look and work like production code.*

### Real-World Projects `🔒`

#### 📓 DevNotes — Developer Knowledge Base
A CLI + web app to capture, tag, and search personal code notes and snippets.

**Prerequisites:** Modules 01–09
**Skills:** Node.js, REST API, file system, search

---

#### 📊 Habit Tracker API
Full REST API with JWT authentication and a persistent SQLite database.

**Prerequisites:** Modules 01–10
**Skills:** Express, JWT, database design, CRUD, testing

---

#### 🤝 CollabBoard — Real-Time Notes
Real-time shared notes using WebSockets — multiple users, live sync.

**Prerequisites:** All above + WebSockets
**Skills:** Event-driven architecture, WebSockets, state synchronization

---

## 📊 Roadmap Status

```
Phase 1 — Foundations     [ ░░░░░░░░░░ ] 50%
Phase 2 — Async JS        [ ░░░░░░░░░░ ] 0%
Phase 3 — The Browser     [ ░░░░░░░░░░ ] 0%
Phase 4 — Deep JS         [ ░░░░░░░░░░ ] 0%
Phase 5 — Node.js         [ ░░░░░░░░░░ ] 0%
Phase 6 — Real-World      [ ░░░░░░░░░░ ] 0%
```

---

<sub>Roadmap is living — updated as the journey evolves.</sub>
