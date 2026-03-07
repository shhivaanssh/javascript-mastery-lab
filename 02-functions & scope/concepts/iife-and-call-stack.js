// --- IIFE (Immediately Invoked Function Expression) ---
// Define and call a function in one shot.
// Classic use: create a private scope, avoid polluting global namespace.

(function() {
  const private = "only here";
  console.log(private);
})();

// console.log(private); // ReferenceError

// Arrow IIFE
(() => {
  console.log("arrow IIFE");
})();

// IIFE with parameters
(function(name, version) {
  console.log(`${name} v${version}`);
})("MyApp", "1.0");

// IIFE returning a value
const config = (function() {
  const env = "production";
  const debug = env !== "production";

  return { env, debug, version: "2.1.0" };
})();

console.log(config.env); // "production"


// Modern alternative — block scope with let/const
{
  const local = "block scoped";
  console.log(local);
}
// IIFEs are less common now but still appear in older codebases


// --- The Call Stack ---
// JS is single-threaded. The call stack tracks which function is running.
// When a function is called, it's pushed. When it returns, it's popped.

function c() {
  console.trace(); // shows the call stack at this point
  return "c done";
}

function b() {
  return c();
}

function a() {
  return b();
}

a();
// Stack at console.trace(): a → b → c (top)


// Stack overflow — too many calls before any return
function infinite() {
  return infinite(); // RangeError: Maximum call stack size exceeded
}
// infinite(); // don't run this


// --- Execution Context ---
// Each function call gets its own execution context with:
// - its own `this`
// - its own local variables
// - a reference to the outer scope (scope chain)

function outer() {
  const x = 10;

  function inner() {
    const y = 20;
    console.log(x + y); // 30 — inner has access to outer's x via scope chain
  }

  inner();
}
outer();


// The global execution context is always at the bottom of the stack.
// When the stack is empty, the event loop can push the next async callback.
