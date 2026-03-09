// --- let and const in depth ---
// Covered var/let/const in module 01. This file focuses on the *why*
// behind the rules and the edge cases that trip people up.


// Temporal Dead Zone (TDZ)
// let and const are hoisted but not initialized.
// Any access before the declaration throws a ReferenceError.

function tdz() {
  // console.log(x); // ReferenceError: Cannot access 'x' before initialization
  let x = 10;
  console.log(x); // 10
}


// const with objects and arrays
// const prevents reassignment of the binding — not mutation of the value.

const config = { debug: false, version: 1 };
config.debug = true;   // allowed
config.env = "prod";   // allowed
// config = {};        // TypeError — can't reassign the binding

const tags = ["js", "node"];
tags.push("react");    // allowed
tags[0] = "ts";        // allowed
// tags = [];          // TypeError


// Block scope in practice
// Real example where block scope prevents a bug

function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]; // new `item` binding each iteration
    setTimeout(() => console.log(item), i * 100);
  }
  // with var, all callbacks would log the last item
}
processItems(["a", "b", "c"]); // logs a, b, c — correctly


// const in switch blocks
// Each case shares scope unless you add braces

switch ("x") {
  case "x": {
    const msg = "matched x";
    console.log(msg);
    break;
  }
  case "y": {
    const msg = "matched y"; // fine — separate block
    console.log(msg);
    break;
  }
}


// Prefer const by default
// Only reach for let when you actually need to reassign.
// This makes intent explicit: const = this never changes.

const TAX_RATE = 0.08;

function calcTotal(price) {
  const tax   = price * TAX_RATE;
  const total = price + tax;
  return total;
  // none of these needed let — no reassignment happened
}


// When let makes sense
function countdown(from) {
  let i = from;
  while (i > 0) {
    console.log(i--);
  }
}

function accumulate(nums) {
  let sum = 0;
  for (const n of nums) sum += n;
  return sum;
}
