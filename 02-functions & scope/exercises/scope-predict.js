// Predict the output of each block before running it.
// Write your answer in a comment, then verify.


// 1
var x = 1;
function first() {
  var x = 2;
  console.log(x);
}
first();
console.log(x);
// your answer:
// actual: 2, 1


// 2
let a = "global";
function second() {
  console.log(a);
  let a = "local";
  console.log(a);
}
// second(); // what happens?
// actual: ReferenceError — temporal dead zone. `a` is hoisted but not initialized.


// 3
function third() {
  for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 0);
  }
}
third();
// your answer:
// actual: 3, 3, 3 — all callbacks share the same `var i`


// 4 — fix exercise 3 using let
function fourthFixed() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 0);
  }
}
fourthFixed();
// actual: 0, 1, 2


// 5
const obj = {
  value: 42,
  getValue: function() {
    return this.value;
  },
  getValueArrow: () => {
    return this?.value;
  },
};

console.log(obj.getValue());      // ?
console.log(obj.getValueArrow()); // ?
// actual: 42, undefined


// 6
function makeCounter() {
  let n = 0;
  return () => ++n;
}

const c1 = makeCounter();
const c2 = makeCounter();

console.log(c1()); // ?
console.log(c1()); // ?
console.log(c2()); // ?
console.log(c1()); // ?
// actual: 1, 2, 1, 3 — c1 and c2 each have their own `n`


// 7
function outer() {
  let count = 0;

  function inner() {
    count++;
    console.log(count);
  }

  return inner;
}

const fn = outer();
fn(); // ?
fn(); // ?
fn(); // ?
// actual: 1, 2, 3


// 8 — shadowing
let color = "blue";

function paint() {
  let color = "red";

  function darker() {
    let color = "dark red";
    console.log(color);
  }

  darker();
  console.log(color);
}

paint();
console.log(color);
// actual: "dark red", "red", "blue"
