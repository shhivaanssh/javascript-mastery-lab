// --- Declaration vs Expression ---

// declaration — hoisted, callable before it's defined
function greet(name) {
  return `Hello, ${name}`;
}

// expression — not hoisted
const greetExpr = function(name) {
  return `Hello, ${name}`;
};

// arrow function — shorter, no own `this`
const greetArrow = (name) => `Hello, ${name}`;
const double = n => n * 2;          // parens optional with one param
const add = (a, b) => a + b;
const getObj = () => ({ id: 1 });   // wrap object in parens


// --- Parameters ---

// default values
function connect(host = "localhost", port = 3000) {
  return `${host}:${port}`;
}
connect();             // "localhost:3000"
connect("example.com"); // "example.com:3000"

// rest parameters — collects remaining args into array
function sum(...nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4); // 10

// arguments object (only in regular functions, not arrow)
function logArgs() {
  console.log(arguments); // array-like object
}


// --- Return values ---

function divide(a, b) {
  if (b === 0) return null; // early return
  return a / b;
}

// implicit return undefined if no return statement
function noop() {}
noop(); // undefined


// --- First-class functions ---

// pass as argument
function runTwice(fn, value) {
  return fn(fn(value));
}
runTwice(double, 3); // 12

// return from function
function multiplier(factor) {
  return (num) => num * factor;
}
const triple = multiplier(3);
triple(5); // 15

// store in array
const ops = [
  n => n + 1,
  n => n * 2,
  n => n ** 2
];
ops[1](4); // 8


// --- Pure vs impure ---

// pure — same input always gives same output, no side effects
function pureAdd(a, b) {
  return a + b;
}

// impure — relies on or changes external state
let total = 0;
function impureAdd(n) {
  total += n; // side effect
  return total;
}
