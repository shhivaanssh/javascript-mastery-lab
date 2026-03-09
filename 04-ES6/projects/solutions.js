// Solutions to challenges.js
// Try each one yourself before reading these.


// Challenge 1
const makeTitle = ({ firstName, lastName, messages }) =>
  `Welcome back, ${firstName} ${lastName}! You have ${messages} messages.`;


// Challenge 2
const power = (base, exponent = 2) => base ** exponent;
// Bonus: ** instead of Math.pow (ES2016)


// Challenge 3
const updateUser = (user, updates) => ({
  ...user,
  ...updates,
  updatedAt: new Date().toISOString(),
});


// Challenge 4
const formatAddress = ({ street, city, country }) =>
  `${street}, ${city}, ${country}`;


// Challenge 5
const getExpensiveProductNames = (products, threshold) =>
  products
    .filter(({ price }) => price > threshold)
    .map(({ name, price }) => `${name} ($${price})`);


// Challenge 6
const indexById = (items) =>
  items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});


// Challenge 7
const getUserCity = (data) =>
  data?.user?.address?.city ?? "Unknown";


// Challenge 8
class Stack {
  #items = [];

  push(item) { this.#items.push(item); return this; }
  pop()      { return this.#items.pop(); }
  peek()     { return this.#items.at(-1); }
  isEmpty()  { return this.#items.length === 0; }
  get size() { return this.#items.length; }
}


// Challenge 9
function* fetchAllPages(fetchFn) {
  let page = 1;
  while (true) {
    const { items, hasMore } = fetchFn(page++);
    yield* items;
    if (!hasMore) break;
  }
}


// Challenge 10
const processOrder = (
  { id: orderId, items, customer },
  { currency = "USD", taxRate = 0.1 } = {}
) => {
  const subtotal = items.reduce((sum, { price, qty }) => sum + price * qty, 0);
  const tax      = subtotal * taxRate;
  const total    = subtotal + tax;
  const fmt      = (n) => `${n.toFixed(2)} ${currency}`;

  return {
    orderId,
    customer: customer?.name ?? "Unknown",
    subtotal: fmt(subtotal),
    tax:      fmt(tax),
    total:    fmt(total),
  };
};
