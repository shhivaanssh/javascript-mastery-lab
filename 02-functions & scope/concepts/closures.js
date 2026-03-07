// A closure is a function that remembers the variables from where it was defined,
// even after that outer function has finished running.


// --- Basic closure ---

function makeGreeter(greeting) {
  return function(name) {
    return `${greeting}, ${name}!`;
  };
}

const sayHello = makeGreeter("Hello");
const sayHey   = makeGreeter("Hey");

sayHello("Alex");  // "Hello, Alex!"
sayHey("Jordan");  // "Hey, Jordan!"
// greeting is still alive inside each returned function


// --- Private state ---

function makeCounter(start = 0) {
  let count = start;

  return {
    increment() { return ++count; },
    decrement() { return --count; },
    reset()     { count = start; return count; },
    value()     { return count; },
  };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.decrement(); // 11
counter.value();     // 11
// count is not accessible from outside — truly private


// --- Factory functions ---

function createUser(name, role) {
  let loginCount = 0;

  return {
    name,
    role,
    login() {
      loginCount++;
      return `${name} logged in (${loginCount} times)`;
    },
    getStats() {
      return { name, role, loginCount };
    },
  };
}

const alex = createUser("Alex", "admin");
alex.login();    // "Alex logged in (1 times)"
alex.login();    // "Alex logged in (2 times)"
alex.getStats(); // { name: "Alex", role: "admin", loginCount: 2 }


// --- Memoization ---
// Cache results so the function doesn't recompute the same input twice

function memoize(fn) {
  const cache = {};

  return function(...args) {
    const key = JSON.stringify(args);
    if (key in cache) {
      console.log("cache hit:", key);
      return cache[key];
    }
    cache[key] = fn(...args);
    return cache[key];
  };
}

function slowDouble(n) {
  // simulate expensive computation
  return n * 2;
}

const fastDouble = memoize(slowDouble);
fastDouble(5);  // computed
fastDouble(5);  // cache hit
fastDouble(10); // computed


// --- Partial application ---
// Fix some arguments now, provide the rest later

function multiply(a, b) {
  return a * b;
}

function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

const double  = partial(multiply, 2);
const triple  = partial(multiply, 3);

double(5);  // 10
triple(5);  // 15


// --- Module pattern (before ES modules existed) ---

const ShoppingCart = (function() {
  const items = [];

  function total() {
    return items.reduce((sum, item) => sum + item.price, 0);
  }

  return {
    add(item)   { items.push(item); },
    remove(name){ 
      const i = items.findIndex(x => x.name === name);
      if (i !== -1) items.splice(i, 1);
    },
    getTotal()  { return total(); },
    getItems()  { return [...items]; }, // return copy, not reference
  };
})();

ShoppingCart.add({ name: "Shirt", price: 25 });
ShoppingCart.add({ name: "Pants", price: 40 });
ShoppingCart.getTotal(); // 65
