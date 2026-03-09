// ============================================================
// REFACTOR CHALLENGES
// Each block is ES5 code. Rewrite it using modern ES6+ syntax.
// The feature hint tells you what to apply.
// Check your answers against: solutions.js
// ============================================================


// Challenge 1 — Template literals
// HINT: template literals, destructuring
function makeTitle(user) {
  return "Welcome back, " + user.firstName + " " + user.lastName + "! You have " + user.messages + " messages.";
}


// Challenge 2 — Arrow + default param
// HINT: arrow function, default parameter
function power(base, exponent) {
  if (exponent === undefined) exponent = 2;
  return Math.pow(base, exponent);
}


// Challenge 3 — Spread instead of Object.assign
// HINT: spread operator
function updateUser(user, updates) {
  return Object.assign({}, user, updates, { updatedAt: new Date().toISOString() });
}


// Challenge 4 — Destructuring in params
// HINT: object destructuring in function parameters
function formatAddress(address) {
  return address.street + ", " + address.city + ", " + address.country;
}


// Challenge 5 — Array methods + arrows
// HINT: map with arrow + template literal, filter with arrow
function getExpensiveProductNames(products, threshold) {
  var expensive = products.filter(function(p) {
    return p.price > threshold;
  });
  return expensive.map(function(p) {
    return p.name + " ($" + p.price + ")";
  });
}


// Challenge 6 — Replace for loop with reduce
// HINT: reduce, computed property, nullish coalescing
function indexById(items) {
  var result = {};
  for (var i = 0; i < items.length; i++) {
    result[items[i].id] = items[i];
  }
  return result;
}


// Challenge 7 — Optional chaining
// HINT: optional chaining (?.), nullish coalescing (??)
function getUserCity(data) {
  if (!data) return "Unknown";
  if (!data.user) return "Unknown";
  if (!data.user.address) return "Unknown";
  return data.user.address.city || "Unknown";
}


// Challenge 8 — Replace constructor + prototype with class
// HINT: class, constructor, method shorthand
function Stack() {
  this.items = [];
}

Stack.prototype.push = function(item) {
  this.items.push(item);
  return this;
};

Stack.prototype.pop = function() {
  return this.items.pop();
};

Stack.prototype.peek = function() {
  return this.items[this.items.length - 1];
};

Stack.prototype.isEmpty = function() {
  return this.items.length === 0;
};

Stack.prototype.size = function() {
  return this.items.length;
};


// Challenge 9 — Generator
// HINT: function*, yield
// Rewrite this to use a generator that yields each page on demand
function fetchAllPages(fetchFn) {
  var results = [];
  var page = 1;
  var hasMore = true;

  // this is synchronous pseudocode — imagine fetchFn is synchronous
  while (hasMore) {
    var data = fetchFn(page);
    results = results.concat(data.items);
    hasMore = data.hasMore;
    page++;
  }

  return results;
}


// Challenge 10 — Everything
// Rewrite this entire function using at least 5 ES6+ features
// HINT: const, arrow, destructuring, template literal, spread, optional chaining, default param
function processOrder(order, options) {
  if (options === undefined) options = {};
  var currency = options.currency || "USD";
  var taxRate  = options.taxRate || 0.1;

  var subtotal = 0;
  for (var i = 0; i < order.items.length; i++) {
    subtotal += order.items[i].price * order.items[i].qty;
  }

  var tax   = subtotal * taxRate;
  var total = subtotal + tax;

  return {
    orderId:  order.id,
    customer: order.customer.name,
    subtotal: subtotal.toFixed(2) + " " + currency,
    tax:      tax.toFixed(2) + " " + currency,
    total:    total.toFixed(2) + " " + currency,
  };
}
