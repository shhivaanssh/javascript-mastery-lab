// Function declarations are fully hoisted — you can call them before they appear
sayHi(); // works

function sayHi() {
  console.log("hi");
}

// Function expressions are NOT hoisted
// greet(); // TypeError: greet is not a function
const greet = function() {
  console.log("hello");
};

// var is hoisted but initialized as undefined
console.log(x); // undefined — not an error, but not the value either
var x = 5;
console.log(x); // 5

// let and const are hoisted but stay in the "temporal dead zone"
// console.log(y); // ReferenceError
let y = 10;


// Why this matters in practice

// This works because of hoisting
function outer() {
  inner();

  function inner() {
    console.log("inner called");
  }
}
outer();

// This does NOT work
function broken() {
  // helper(); // TypeError
  const helper = () => console.log("help");
  helper();
}
broken();


// Class declarations are also hoisted but not initialized
// const obj = new Animal(); // ReferenceError
class Animal {
  constructor(name) {
    this.name = name;
  }
}
