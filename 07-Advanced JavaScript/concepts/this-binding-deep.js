// `this` is determined at call time, not definition time.
// There are 5 binding rules, applied in priority order:
//   1. new binding
//   2. Explicit binding (call/apply/bind)
//   3. Implicit binding (method call)
//   4. Default binding (standalone call)
//   5. Arrow — no own `this`, inherits lexically


// ── 1. Default binding ──
// Standalone function call. `this` is global (window/globalThis) in non-strict,
// undefined in strict mode.

function whoAmI() {
  console.log(this); // globalThis or undefined
}
whoAmI();

"use strict";
function strict() {
  console.log(this); // undefined — strict prevents global binding
}


// ── 2. Implicit binding ──
// A method call — the object to the left of the dot is `this`.

const user = {
  name: "Alex",
  greet() {
    return `Hi, I'm ${this.name}`;
  },
};

user.greet(); // "Hi, I'm Alex" — this = user


// ── Implicit binding loss ──
// The most common `this` bug. Extracting a method loses its context.

const greet = user.greet;
greet(); // "Hi, I'm undefined" — this is now global

// Same problem in callbacks
setTimeout(user.greet, 100); // this is global inside setTimeout

// Also triggered by:
const arr = [user.greet];
arr[0]();  // this is arr, not user

// Fix options:
setTimeout(() => user.greet(), 100);   // arrow wraps the call
setTimeout(user.greet.bind(user), 100); // bind locks this


// ── 3. Explicit binding — call / apply / bind ──

function introduce(role, company) {
  return `${this.name} — ${role} at ${company}`;
}

const person = { name: "Jordan" };

introduce.call(person, "engineer", "Acme");      // pass args individually
introduce.apply(person, ["engineer", "Acme"]);   // pass args as array
const bound = introduce.bind(person);            // return new pre-bound function
bound("designer", "Globex");

// Partial application with bind
const alexIntro = introduce.bind({ name: "Alex" }, "senior dev");
alexIntro("MegaCorp"); // args after the first are pre-filled


// ── 4. new binding ──
// When a function is called with new:
//   1. A fresh object is created
//   2. [[Prototype]] is set to Constructor.prototype
//   3. `this` inside the function points to that new object
//   4. The new object is returned (unless the function returns an object)

function Dog(name, breed) {
  this.name  = name;
  this.breed = breed;
  this.bark  = function() { return `${this.name} says woof`; };
}

const rex = new Dog("Rex", "Labrador");
rex.bark(); // "Rex says woof" — this = rex


// ── 5. Arrow functions ──
// No own `this`. Captures lexically from the surrounding scope at definition.

class Timer {
  #seconds = 0;

  start() {
    // Arrow captures `this` = the Timer instance
    setInterval(() => {
      this.#seconds++;
      console.log(this.#seconds);
    }, 1000);
  }
}


// ── Priority in action ──

function fn() { return this.x; }
const obj = { x: 1, fn };

// Default
fn();              // undefined (strict) or global.x

// Implicit
obj.fn();          // 1

// Explicit overrides implicit
obj.fn.call({ x: 2 }); // 2

// new overrides explicit
function Ctor() { this.x = 99; }
const instance = new Ctor();
// new always returns the fresh object, call/apply are ignored with new


// ── Gotchas ──

// 1. Chained property access — only immediate left-of-dot matters
const a = { b: { name: "b", fn() { return this.name; } } };
const { fn: extracted } = a.b;
extracted(); // undefined — lost the b context

// 2. Callback in class method
class Button {
  label = "Submit";

  // Bad — regular method loses `this` when passed as callback
  handleClick() {
    console.log(this.label); // undefined if called as a bare function
  }

  // Good — arrow class field, `this` is always the instance
  handleClickArrow = () => {
    console.log(this.label); // "Submit" always
  };
}

const btn = new Button();
document.addEventListener("click", btn.handleClick);      // broken
document.addEventListener("click", btn.handleClickArrow); // works
document.addEventListener("click", btn.handleClick.bind(btn)); // also works
