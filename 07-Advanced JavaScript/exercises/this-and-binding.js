// ── Predict the output ──
// Read each block, write your answer, then run it to check.

// 1.
const obj = {
  x: 10,
  getX() { return this.x; },
};
const fn = obj.getX;
// console.log(fn()); // ?    → undefined (strict) or global.x


// 2.
function greet() { return `Hi, ${this.name}`; }
const alice = { name: "Alice" };
const bob   = { name: "Bob" };
// console.log(greet.call(alice));           // ?   → "Hi, Alice"
// console.log(greet.apply(bob));            // ?   → "Hi, Bob"
// console.log(greet.bind(alice)());         // ?   → "Hi, Alice"


// 3.
const counter = {
  count: 0,
  increment() { this.count++; return this.count; },
};
const inc = counter.increment;
// console.log(inc()); // ?  → NaN or error (this.count is undefined)


// 4.
const obj2 = {
  value: 42,
  arrow: () => this?.value,
  method() { return (() => this.value)(); },
};
// console.log(obj2.arrow());   // ?  → undefined (arrow, this = outer scope)
// console.log(obj2.method());  // ?  → 42 (nested arrow captures method's this)


// ── Challenges ──

// 5. Fix these three broken callbacks using three different techniques
class Timer {
  seconds = 0;

  start() {
    // All three of these are broken — this.seconds is undefined
    // Fix a) using .bind()
    // setInterval(function() { this.seconds++; console.log(this.seconds); }, 1000);

    // Fix b) using an arrow function
    // setInterval(function() { this.seconds++; }, 1000);

    // Fix c) using a stored reference
    // const tick = function() { this.seconds++; };
    // setInterval(tick, 1000);
  }
}


// 6. Implement Function.prototype.myCall from scratch
Function.prototype.myCall = function(thisArg, ...args) {
  // hint: temporarily set a property on thisArg, call it, delete it
  const key = Symbol("temp");
  const target = thisArg ?? globalThis;
  target[key] = this;
  const result = target[key](...args);
  delete target[key];
  return result;
};

function add(a, b) { return a + b; }
console.log(add.myCall(null, 2, 3));       // 5
console.log(greet.myCall({ name: "Dev" })); // "Hi, Dev"


// 7. Implement Function.prototype.myApply from scratch
Function.prototype.myApply = function(thisArg, args = []) {
  return this.myCall(thisArg, ...args);
};

console.log(add.myApply(null, [10, 20])); // 30


// 8. Implement Function.prototype.myBind from scratch
// Must support partial application
Function.prototype.myBind = function(thisArg, ...partial) {
  const fn = this;
  return function(...rest) {
    return fn.myCall(thisArg, ...partial, ...rest);
  };
};

const double = add.myBind(null, 2);
console.log(double(5));   // 7
console.log(double(10));  // 12

const logName = greet.myBind({ name: "Sam" });
console.log(logName()); // "Hi, Sam"


// 9. Build a method borrowing utility
// borrow(source, methodName, target) should call source[methodName] with target as `this`

function borrow(source, methodName, target, ...args) {
  return source[methodName].apply(target, args);
}

const arrayLike = { 0: "a", 1: "b", 2: "c", length: 3 };
const joined = borrow(Array.prototype, "join", arrayLike, "-");
console.log(joined); // "a-b-c"

const sliced = borrow(Array.prototype, "slice", arrayLike, 1);
console.log(sliced); // ["b", "c"]


// 10. Build a mixin that binds all methods to the instance automatically
function autoBind(instance) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto)
    .filter(key => key !== "constructor" && typeof instance[key] === "function")
    .forEach(key => {
      instance[key] = instance[key].bind(instance);
    });
  return instance;
}

class Button {
  label = "Click me";
  onClick() { return `${this.label} was clicked`; }
  onHover() { return `hovering over ${this.label}`; }
}

const btn = autoBind(new Button());
const { onClick, onHover } = btn;  // extract — normally breaks this
console.log(onClick());  // "Click me was clicked"
console.log(onHover());  // "hovering over Click me"
