// Arrow functions are not just shorter syntax.
// They behave differently from regular functions in two key ways:
//   1. No own `this` — they inherit it from the enclosing scope
//   2. Can't be used as constructors (no `new`)
// Also: no `arguments` object, no `prototype` property


// --- Syntax forms ---

const double  = x => x * 2;                     // single param, implicit return
const add     = (a, b) => a + b;                 // multiple params
const greet   = () => "hello";                   // no params
const getObj  = () => ({ id: 1, name: "Alex" }); // object — wrap in parens
const multiLine = (x) => {                       // block body — need explicit return
  const doubled = x * 2;
  return doubled + 1;
};


// --- Implicit return ---

const nums = [1, 2, 3, 4, 5];

nums.map(n => n * 2);
nums.filter(n => n > 2);
nums.reduce((acc, n) => acc + n, 0);

// With destructuring
const users = [{ name: "Alex", age: 28 }, { name: "Jordan", age: 32 }];
users.map(({ name, age }) => `${name} is ${age}`);


// --- Lexical `this` ---

class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // Arrow captures `this` from start() — which is the Timer instance
    setInterval(() => {
      this.seconds++;
      console.log(this.seconds);
    }, 1000);
    // A regular function here would have `this` as undefined (strict) or global
  }
}


// --- Where arrow functions break things ---

// 1. Object methods — you want `this` to be the object
const counter = {
  count: 0,

  // wrong:
  badIncrement: () => {
    this.count++; // `this` is the outer scope, not `counter`
  },

  // right:
  increment() {
    this.count++;
    return this;
  },
};

// 2. Functions that need `arguments`
function logArgs() {
  console.log(arguments); // works
}

const logArgsArrow = (...args) => {
  // arguments doesn't exist here — use rest params instead
  console.log(args);
};

// 3. Dynamic `this` in event listeners
// element.addEventListener("click", function() {
//   this.classList.toggle("active"); // `this` = element
// });
// element.addEventListener("click", () => {
//   this.classList.toggle("active"); // `this` = outer scope — probably window
// });

// 4. Prototype methods
function Person(name) {
  this.name = name;
}
// wrong — `this` in arrow is the module/global scope, not the instance
Person.prototype.greet = () => `Hi, I'm ${this?.name}`;

// right
Person.prototype.greet = function() { return `Hi, I'm ${this.name}`; };


// --- Chaining with arrows ---

const result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .filter(n => n % 2 === 0)
  .map(n => n ** 2)
  .reduce((sum, n) => sum + n, 0);

console.log(result); // 220


// --- Arrow functions and closures ---
// Arrows work great as returned functions — lexical `this` is usually what you want

function makeMultiplier(factor) {
  return n => n * factor; // captures `factor` from outer scope
}

const triple = makeMultiplier(3);
triple(7); // 21
