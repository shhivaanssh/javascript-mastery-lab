// ── 1. this binding quiz — predict the output ──

const obj = {
  value: 42,
  getValue() { return this.value; },
  getValueArrow: () => this?.value,
};

// a) obj.getValue()              → 42
// b) const fn = obj.getValue; fn() → undefined (strict) / window.value (non-strict)
// c) obj.getValueArrow()         → undefined — arrow, this = outer scope (module/global)
// d) obj.getValue.call({ value: 99 }) → 99


// ── 2. Implement bind from scratch ──

Function.prototype.myBind = function(thisArg, ...partialArgs) {
  const originalFn = this;
  return function(...callArgs) {
    return originalFn.apply(thisArg, [...partialArgs, ...callArgs]);
  };
};

function multiply(a, b) { return a * b; }
const double = multiply.myBind(null, 2);
double(5);   // 10
double(10);  // 20


// ── 3. Prototype chain — extend without class ──

const animal = {
  breathe() { return `${this.name} breathes`; },
  toString() { return `[${this.constructor?.name ?? "Animal"}: ${this.name}]`; },
};

const dog = Object.create(animal);
dog.speak = function() { return `${this.name} says woof`; };

const rex = Object.create(dog);
rex.name = "Rex";

rex.speak();   // "Rex says woof"
rex.breathe(); // "Rex breathes"
Object.getPrototypeOf(rex) === dog;    // true
Object.getPrototypeOf(dog) === animal; // true


// ── 4. Build a class with private fields, getters, static factory ──

class Vector {
  #x; #y;

  constructor(x, y) { this.#x = x; this.#y = y; }

  get x() { return this.#x; }
  get y() { return this.#y; }

  get magnitude() {
    return Math.sqrt(this.#x ** 2 + this.#y ** 2);
  }

  add(other)    { return new Vector(this.#x + other.x, this.#y + other.y); }
  scale(scalar) { return new Vector(this.#x * scalar, this.#y * scalar); }
  dot(other)    { return this.#x * other.x + this.#y * other.y; }
  normalize()   { return this.scale(1 / this.magnitude); }

  equals(other) { return this.#x === other.x && this.#y === other.y; }

  toString()    { return `Vector(${this.#x}, ${this.#y})`; }

  [Symbol.toPrimitive](hint) {
    return hint === "string" ? this.toString() : this.magnitude;
  }

  static ZERO  = new Vector(0, 0);
  static UNIT_X = new Vector(1, 0);
  static UNIT_Y = new Vector(0, 1);
  static from([x, y]) { return new Vector(x, y); }
}

const v1 = new Vector(3, 4);
v1.magnitude;           // 5
v1.add(new Vector(1, 0)).toString(); // "Vector(4, 4)"
`${v1}`;                // "Vector(3, 4)"
+v1;                    // 5


// ── 5. Custom iterable linked list ──

class LinkedList {
  #head = null;
  #size = 0;

  push(value) {
    const node = { value, next: null };
    if (!this.#head) { this.#head = node; }
    else {
      let cur = this.#head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this.#size++;
    return this;
  }

  get size() { return this.#size; }

  [Symbol.iterator]() {
    let current = this.#head;
    return {
      next() {
        if (!current) return { value: undefined, done: true };
        const value = current.value;
        current = current.next;
        return { value, done: false };
      },
    };
  }
}

const list = new LinkedList();
list.push(1).push(2).push(3);
[...list];  // [1, 2, 3]
for (const n of list) console.log(n);


// ── 6. Generator pipeline ──

function* map(fn, iter)    { for (const x of iter) yield fn(x); }
function* filter(fn, iter) { for (const x of iter) { if (fn(x)) yield x; } }
function* take(n, iter)    { let i = 0; for (const x of iter) { if (i++ >= n) break; yield x; } }
function* naturals(n = 1)  { while (true) yield n++; }

function pipe(seed, ...fns) {
  return fns.reduce((acc, fn) => fn(acc), seed);
}

[...pipe(
  naturals(),
  iter => filter(n => n % 2 !== 0, iter),  // odd numbers
  iter => map(n => n * n, iter),            // squared
  iter => take(5, iter),                    // first 5
)]; // [1, 9, 25, 49, 81]


// ── 7. Validation proxy ──

function typed(schema) {
  return new Proxy({}, {
    set(target, key, value) {
      const expected = schema[key];
      if (!expected) throw new TypeError(`Unknown property: ${key}`);
      if (typeof value !== expected) {
        throw new TypeError(`${key}: expected ${expected}, got ${typeof value}`);
      }
      return Reflect.set(target, key, value);
    },
    get(target, key, receiver) {
      if (!(key in target)) throw new ReferenceError(`${key} not set`);
      return Reflect.get(target, key, receiver);
    },
  });
}

const record = typed({ name: "string", age: "number", active: "boolean" });
record.name   = "Alex"; // ok
record.age    = 30;     // ok
record.active = true;   // ok
// record.age = "30";   // TypeError: age: expected number, got string


// ── 8. WeakRef memoize — cache that doesn't prevent GC ──

function weakMemo(fn) {
  const cache = new Map();
  const reg   = new FinalizationRegistry(key => cache.delete(key));

  return function(key) {
    const cached = cache.get(key)?.deref();
    if (cached !== undefined) return cached;

    const result = fn(key);
    if (result !== null && typeof result === "object") {
      cache.set(key, new WeakRef(result));
      reg.register(result, key);
    }
    return result;
  };
}
