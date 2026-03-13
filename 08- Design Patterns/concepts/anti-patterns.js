// Anti-patterns are common responses to recurring problems that seem
// reasonable but are counterproductive. Knowing them is as important
// as knowing the patterns.


// ════════════════════════════════════════════════════════
// 1. GOD OBJECT
// One class that knows and does too much.
// Becomes impossible to test, maintain, or extend.
// ════════════════════════════════════════════════════════

// ❌ BAD
class App {
  users = [];
  orders = [];
  products = [];

  createUser(data)       { /* ... */ }
  deleteUser(id)         { /* ... */ }
  createOrder(data)      { /* ... */ }
  calculateTax(order)    { /* ... */ }
  sendEmail(to, subject) { /* ... */ }
  generatePDF(order)     { /* ... */ }
  connectDB()            { /* ... */ }
  authenticateUser(creds){ /* ... */ }
  logError(err)          { /* ... */ }
  // 40 more methods...
}

// ✅ GOOD — split by responsibility
class UserService    { /* user CRUD */ }
class OrderService   { /* order logic */ }
class TaxCalculator  { /* tax rules */ }
class EmailService   { /* email sending */ }
class PDFGenerator   { /* PDF generation */ }


// ════════════════════════════════════════════════════════
// 2. MAGIC NUMBERS & STRINGS
// Literals scattered through the code with no explanation.
// ════════════════════════════════════════════════════════

// ❌ BAD
function getDiscount(type) {
  if (type === 1) return 0.1;
  if (type === 2) return 0.2;
  if (type === 3) return 0.5;
}

// ✅ GOOD
const DISCOUNT_TYPES = Object.freeze({
  STANDARD: "standard",
  PREMIUM:  "premium",
  VIP:      "vip",
});

const DISCOUNT_RATES = Object.freeze({
  [DISCOUNT_TYPES.STANDARD]: 0.10,
  [DISCOUNT_TYPES.PREMIUM]:  0.20,
  [DISCOUNT_TYPES.VIP]:      0.50,
});

function getDiscount2(type) {
  const rate = DISCOUNT_RATES[type];
  if (rate === undefined) throw new TypeError(`Unknown discount type: ${type}`);
  return rate;
}


// ════════════════════════════════════════════════════════
// 3. CALLBACK HELL (PYRAMID OF DOOM)
// Already covered in Module 05 — the fix is Promises/async
// ════════════════════════════════════════════════════════

// ❌ BAD
getUser(1, (err, user) => {
  if (err) return handleErr(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handleErr(err);
    getProducts(orders[0].id, (err, products) => {
      if (err) return handleErr(err);
      // ...
    });
  });
});

// ✅ GOOD
async function loadData() {
  const user     = await getUser(1);
  const orders   = await getOrders(user.id);
  const products = await getProducts(orders[0].id);
  return { user, orders, products };
}


// ════════════════════════════════════════════════════════
// 4. PREMATURE OPTIMISATION
// Optimising before measuring. Complexity for no gain.
// ════════════════════════════════════════════════════════

// ❌ BAD — "optimising" a function called once at startup
function getConfig() {
  // hand-rolled lookup table for 5 keys... that never changes
  const lookup = new Array(256).fill(null);
  lookup[99] = "c"; // etc.
  return lookup;
}

// ✅ GOOD — write clearly first, profile, THEN optimise hot paths
function getConfig2() {
  return { theme: "dark", lang: "en" };
}


// ════════════════════════════════════════════════════════
// 5. MUTATING FUNCTION ARGUMENTS
// Modifying input data breaks callers' expectations silently.
// ════════════════════════════════════════════════════════

// ❌ BAD
function addDiscount(order) {
  order.total *= 0.9;  // mutates the caller's object!
  return order;
}

const myOrder = { total: 100 };
addDiscount(myOrder);
console.log(myOrder.total); // 90 — caller didn't expect this!

// ✅ GOOD — return new object
function addDiscount2(order) {
  return { ...order, total: order.total * 0.9 };
}

const discounted = addDiscount2(myOrder);
// myOrder is untouched


// ════════════════════════════════════════════════════════
// 6. IMPLICIT GLOBALS
// Variables created without declaration leak into global scope.
// ════════════════════════════════════════════════════════

// ❌ BAD (non-strict mode)
function calculateTotal(items) {
  total = 0; // no let/const/var → window.total in browser!
  items.forEach(item => total += item.price);
  return total;
}

// ✅ GOOD
function calculateTotal2(items) {
  let total = 0;
  items.forEach(item => { total += item.price; });
  return total;
}

// Use "use strict" or ESM (always strict) to catch these


// ════════════════════════════════════════════════════════
// 7. BOOLEAN TRAP
// Boolean params force callers to guess what true/false means.
// ════════════════════════════════════════════════════════

// ❌ BAD
createUser("Alex", true, false, true);
// What do true, false, true mean? Need to check the signature.

// ✅ GOOD — named options object
createUser2("Alex", { isAdmin: true, sendEmail: false, isActive: true });

// Or if a boolean param is truly unavoidable, use a constant:
const SEND_EMAIL = true;
createUser("Alex", SEND_EMAIL);


// ════════════════════════════════════════════════════════
// 8. SPAGHETTI ASYNC
// Using async/await incorrectly — sequential when parallel is possible.
// ════════════════════════════════════════════════════════

// ❌ BAD — 3 × 300ms = 900ms total
async function loadDashboard_bad(userId) {
  const user   = await fetchUser(userId);   // waits 300ms
  const posts  = await fetchPosts(userId);  // then waits 300ms
  const notifs = await fetchNotifs(userId); // then waits 300ms
  return { user, posts, notifs };
}

// ✅ GOOD — max(300, 300, 300) = 300ms total
async function loadDashboard_good(userId) {
  const [user, posts, notifs] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchNotifs(userId),
  ]);
  return { user, posts, notifs };
}


// ════════════════════════════════════════════════════════
// 9. CONSTRUCTOR SIDE EFFECTS
// Constructors that do async work, fetch data, or throw.
// ════════════════════════════════════════════════════════

// ❌ BAD
class Database {
  constructor(url) {
    this.conn = this.connect(url); // async! constructor can't await
  }
  async connect(url) { /* ... */ }
}

// ✅ GOOD — static async factory
class Database2 {
  #conn;
  constructor(conn) { this.#conn = conn; } // only assign, never async

  static async create(url) {
    const conn = await Database2.#connect(url);
    return new Database2(conn);
  }

  static async #connect(url) { /* ... */ }
}

const db = await Database2.create("postgres://...");


// ════════════════════════════════════════════════════════
// 10. OVER-ENGINEERING
// Applying heavyweight patterns where a simple function suffices.
// ════════════════════════════════════════════════════════

// ❌ BAD — AbstractSingletonProxyFactoryBean vibes
class AbstractGreeterFactory {
  createGreeter() { throw new Error("implement"); }
}
class ConcreteEnglishGreeterFactory extends AbstractGreeterFactory {
  createGreeter() { return new EnglishGreeter(); }
}
class EnglishGreeter {
  greet(name) { return `Hello, ${name}`; }
}
new ConcreteEnglishGreeterFactory().createGreeter().greet("Alex");

// ✅ GOOD
const greet = (name) => `Hello, ${name}`;
greet("Alex");

// Apply patterns when they solve a real problem you have,
// not one you imagine you might have someday.

function fetchUser()  { return Promise.resolve({ id: 1 }); }
function fetchPosts() { return Promise.resolve([]); }
function fetchNotifs(){ return Promise.resolve([]); }
function createUser2(name, opts = {}) {}
function handleErr(e) { console.error(e); }
function getUser(id, cb) { cb(null, { id }); }
function getOrders(id, cb) { cb(null, [{ id: 1 }]); }
function getProducts(id, cb) { cb(null, []); }
