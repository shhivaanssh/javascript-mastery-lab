# 📓 Learning Log — JavaScript Mastery Lab

> A running journal of what I learned, built, and struggled with.
> Updated consistently. Honest about gaps. Celebrating small wins.

---

## 🧭 How To Read This Log

Each entry follows this format:

```
## Day / Week N — [Date]
**Topic:** What I focused on
**Learned:** Key concepts that clicked
**Built:** Any code, mini project, or exercise
**Struggled With:** Honest notes on confusion
**Next:** What I'm tackling next
```

---

## 📅 Log Entries

---

### Day 1 — [YYYY-MM-DD]
**Topic:** JavaScript Basics — Variables, Data Types, Operators

**Learned:**
- Difference between `var`, `let`, and `const` — and why `var` is mostly avoided today
- JavaScript's 7 primitive types: `string`, `number`, `bigint`, `boolean`, `undefined`, `null`, `symbol`
- Type coercion gotchas: why `"5" + 3 = "53"` but `"5" - 3 = 2`
- Template literals are far cleaner than string concatenation

**Built:**
- `01-basics/concepts/variables.js` — annotated examples of all variable types
- `01-basics/exercises/type-coercion.js` — 10 coercion puzzles with explanations
- `01-basics/project/calculator.js` — basic CLI calculator (add, subtract, multiply, divide)

**Struggled With:**
- `null` vs `undefined` still feels fuzzy — need more real examples
- Not yet clear when `BigInt` is actually useful

**Next:** Conditionals, loops, and writing my first functions

---

### Day 2 — [YYYY-MM-DD]
**Topic:** Control Flow — Conditionals and Loops

**Learned:**
- `if/else`, `switch`, ternary operator — when each one makes sense
- `for`, `while`, `do...while` — and `break`/`continue`
- Falsy values in JS: `0`, `""`, `null`, `undefined`, `NaN`, `false`

**Built:**
- `01-basics/concepts/control-flow.js`
- `01-basics/exercises/fizzbuzz.js` — classic but useful for loop logic

**Struggled With:**
- Switch fall-through behaviour tripped me up — need to remember `break`

**Next:** Functions — declarations, expressions, arrow functions

---

### Day 3 — [YYYY-MM-DD]
**Topic:** Functions — Declarations, Expressions, Arrow Functions

**Learned:**
- Function declarations are hoisted; function expressions are not
- Arrow functions don't have their own `this` — this will matter later
- Parameters vs arguments; default parameters in ES6
- First-class functions — functions as values, passed as arguments

**Built:**
- `02-functions-and-scope/concepts/functions-intro.js`
- `02-functions-and-scope/exercises/higher-order-intro.js`

**Struggled With:**
- Wrapping my head around why hoisting works the way it does
- Arrow function `this` binding — saved a note to revisit during OOP

**Next:** Scope — global, function, block. Then closures.

---

### Week 2 — [YYYY-MM-DD to YYYY-MM-DD]
**Focus:** Scope, Closures, and the Call Stack

**Learned:**
- Lexical scope — a function has access to variables in the scope where it was *defined*, not where it was *called*
- Closures: a function + its surrounding scope, bundled together
- Practical closure uses: data privacy, factory functions, memoization
- The call stack: how JS tracks execution contexts

**Built:**
- `02-functions-and-scope/concepts/closures.js` — 5 closure examples from basic to advanced
- `02-functions-and-scope/project/memoize.js` — working memoization function using closures
- `02-functions-and-scope/exercises/scope-quiz.js` — 8 predict-the-output exercises

**Struggled With:**
- The mental model for closures took 2 days to click
- Finally got it when I thought of closure as "a backpack of variables" a function carries

**Highlight:**
```javascript
// The moment closures clicked for me:
function makeCounter() {
  let count = 0;           // this lives in the closure
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count
  };
}
// count is private — only accessible through the returned methods
```

**Next:** Arrays — methods, iteration, transformation

---

<!-- ================================================ -->
<!-- TEMPLATE — Copy and fill in for each new entry  -->
<!-- ================================================

### Day N — [YYYY-MM-DD]
**Topic:**

**Learned:**
-
-

**Built:**
-

**Struggled With:**
-

**Next:**

-->

---

## 📈 Progress Tracker

| Module | Started | Completed | Mini Project |
|--------|---------|-----------|--------------|
| 01 - Basics | — | — | — |
| 02 - Functions & Scope | — | — | — |
| 03 - Arrays & Objects | — | — | — |
| 04 - ES6+ | — | — | — |
| 05 - Async JS | — | — | — |
| 06 - DOM | — | — | — |
| 07 - Advanced JS | — | — | — |
| 08 - Design Patterns | — | — | — |
| 09 - Node.js | — | — | — |
| 10 - API Dev | — | — | — |

---

## 🏆 Wins Wall

> Small celebrations matter. Every concept mastered gets recorded here.

- [ ] Wrote my first closure
- [ ] Built first async function with error handling
- [ ] Completed first Node.js CLI app
- [ ] Deployed first API endpoint
- [ ] Used a design pattern in a real project

---

<sub>Logs are honest. Progress is real. The repo doesn't lie.</sub>
