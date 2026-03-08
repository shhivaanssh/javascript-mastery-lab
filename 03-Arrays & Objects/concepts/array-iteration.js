const products = [
  { id: 1, name: "Keyboard",  price: 80,  category: "electronics", inStock: true  },
  { id: 2, name: "Desk",      price: 320, category: "furniture",   inStock: true  },
  { id: 3, name: "Mouse",     price: 45,  category: "electronics", inStock: false },
  { id: 4, name: "Chair",     price: 250, category: "furniture",   inStock: true  },
  { id: 5, name: "Headphones",price: 120, category: "electronics", inStock: true  },
];


// --- forEach — side effects only, returns undefined ---

products.forEach(p => console.log(p.name));

// with index
products.forEach((p, i) => console.log(`${i + 1}. ${p.name}`));


// --- map — transform each item, returns new array ---

const names  = products.map(p => p.name);
// ["Keyboard", "Desk", "Mouse", "Chair", "Headphones"]

const prices = products.map(p => p.price);
// [80, 320, 45, 250, 120]

const cards  = products.map(p => ({
  label: p.name,
  display: `$${p.price}`,
  available: p.inStock,
}));


// --- filter — keep items where fn returns true ---

const inStock      = products.filter(p => p.inStock);
const electronics  = products.filter(p => p.category === "electronics");
const affordable   = products.filter(p => p.price < 100);
const cheapElec    = products.filter(p => p.category === "electronics" && p.price < 100);


// --- find / findIndex — first match ---

const mouse     = products.find(p => p.name === "Mouse");
const mouseIdx  = products.findIndex(p => p.name === "Mouse"); // 2
const expensive = products.find(p => p.price > 200);

// findLast / findLastIndex (ES2023)
const lastElec  = products.findLast(p => p.category === "electronics");


// --- some / every --- 

products.some(p => p.price > 300);         // true  — at least one
products.every(p => p.inStock);            // false — not all in stock
products.every(p => p.price > 0);          // true  — all have positive price
products.some(p => p.category === "food"); // false


// --- reduce — fold into a single value ---

const totalCost = products.reduce((sum, p) => sum + p.price, 0);
// 815

const mostExpensive = products.reduce((max, p) => p.price > max.price ? p : max);
// { name: "Desk", price: 320, ... }

// Group by category
const byCategory = products.reduce((groups, p) => {
  const key = p.category;
  if (!groups[key]) groups[key] = [];
  groups[key].push(p);
  return groups;
}, {});
// { electronics: [...], furniture: [...] }

// Count by property
const stockCount = products.reduce((acc, p) => {
  acc[p.inStock ? "inStock" : "outOfStock"]++;
  return acc;
}, { inStock: 0, outOfStock: 0 });
// { inStock: 4, outOfStock: 1 }

// Build a lookup map by id
const byId = products.reduce((map, p) => {
  map[p.id] = p;
  return map;
}, {});
byId[3]; // { id: 3, name: "Mouse", ... }


// --- Chaining ---

const report = products
  .filter(p => p.inStock)
  .sort((a, b) => a.price - b.price)
  .map(p => `${p.name}: $${p.price}`);

// ["Mouse: $45", "Keyboard: $80", "Headphones: $120", "Chair: $250", "Desk: $320"]
// wait, Mouse is out of stock — correct result excludes it:
// ["Keyboard: $80", "Headphones: $120", "Chair: $250", "Desk: $320"]


// --- sort is mutating — clone first before sorting ---

const sorted = [...products].sort((a, b) => a.price - b.price);
// original products order unchanged
