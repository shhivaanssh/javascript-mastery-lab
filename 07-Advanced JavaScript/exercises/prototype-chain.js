// ── Predict the output ──

// 1. Own vs inherited
const animal = { breathe: true };
const dog    = Object.create(animal);
dog.bark     = true;

// console.log("bark"    in dog);           // ?  → true (own)
// console.log("breathe" in dog);           // ?  → true (inherited)
// console.log(dog.hasOwnProperty("bark")); // ?  → true
// console.log(dog.hasOwnProperty("breathe")); // ? → false


// 2. Shadowing
const base  = { x: 1 };
const child = Object.create(base);
child.x     = 99;

// console.log(child.x); // ?  → 99  (own property shadows)
// console.log(base.x);  // ?  → 1   (unchanged)
// console.log(Object.getPrototypeOf(child).x); // ?  → 1


// 3. Constructor chain
function Vehicle(type) { this.type = type; }
Vehicle.prototype.describe = function() { return `I am a ${this.type}`; };

function Car(model) {
  Vehicle.call(this, "car");
  this.model = model;
}
Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

const tesla = new Car("Model S");
// console.log(tesla.describe());          // ?  → "I am a car"
// console.log(tesla instanceof Car);      // ?  → true
// console.log(tesla instanceof Vehicle);  // ?  → true
// console.log(tesla.constructor === Car); // ?  → true


// ── Challenges ──

// 4. Implement Object.create from scratch (simplified)
function myCreate(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
}

const base2 = { greet() { return `Hi from ${this.name}`; } };
const child2 = myCreate(base2);
child2.name  = "child";
console.log(child2.greet());                    // "Hi from child"
console.log(Object.getPrototypeOf(child2) === base2); // true


// 5. Build a three-level prototype chain without class syntax
// Animal → Mammal → Dog

const Animal = {
  breathe() { return `${this.name} breathes`; },
  toString() { return `[${this.kind}: ${this.name}]`; },
};

const Mammal = Object.create(Animal);
Mammal.warmBlooded = true;
Mammal.nurse = function() { return `${this.name} nurses young`; };

const Dog = Object.create(Mammal);
Dog.kind = "Dog";
Dog.speak = function() { return `${this.name} barks`; };

function createDog(name) {
  const d = Object.create(Dog);
  d.name  = name;
  return d;
}

const rex = createDog("Rex");
console.log(rex.breathe());  // "Rex breathes"
console.log(rex.nurse());    // "Rex nurses young"
console.log(rex.speak());    // "Rex barks"
console.log(rex.warmBlooded); // true
console.log(rex.toString());  // "[Dog: Rex]"
console.log(Animal.isPrototypeOf(rex));  // true
console.log(Mammal.isPrototypeOf(rex));  // true


// 6. Implement instanceof from scratch
function myInstanceOf(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === Constructor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

console.log(myInstanceOf(tesla, Car));     // true
console.log(myInstanceOf(tesla, Vehicle)); // true
console.log(myInstanceOf(tesla, Array));   // false


// 7. Mixin composition — add methods to a prototype without inheritance
function mixin(target, ...sources) {
  sources.forEach(source => {
    Object.getOwnPropertyNames(source).forEach(key => {
      if (key === "constructor") return;
      target[key] = source[key];
    });
  });
  return target;
}

const Serializable = {
  serialize()   { return JSON.stringify(this); },
  inspect()     { return `${this.constructor.name}(${JSON.stringify(this)})`; },
};

const Comparable = {
  equals(other) { return JSON.stringify(this) === JSON.stringify(other); },
};

function Point(x, y) { this.x = x; this.y = y; }
mixin(Point.prototype, Serializable, Comparable);

const p1 = new Point(1, 2);
const p2 = new Point(1, 2);
const p3 = new Point(3, 4);

console.log(p1.serialize());    // '{"x":1,"y":2}'
console.log(p1.equals(p2));     // true
console.log(p1.equals(p3));     // false


// 8. Walk and log the full prototype chain
function getChain(obj) {
  const chain = [];
  let current = Object.getPrototypeOf(obj);
  while (current) {
    const name = current.constructor?.name ?? "Object";
    const ownMethods = Object.getOwnPropertyNames(current)
      .filter(k => k !== "constructor" && typeof current[k] === "function");
    chain.push({ name, methods: ownMethods });
    current = Object.getPrototypeOf(current);
  }
  return chain;
}

console.log(JSON.stringify(getChain(tesla), null, 2));
// Car (describe) → Vehicle → Object (hasOwnProperty, toString, ...)


// 9. Property descriptor exploration
const frozen = {};
Object.defineProperty(frozen, "PI", {
  value:        3.14159,
  writable:     false,
  enumerable:   true,
  configurable: false,
});

console.log(frozen.PI);              // 3.14159
frozen.PI = 999;                     // silent fail in non-strict
console.log(frozen.PI);              // still 3.14159
console.log(Object.getOwnPropertyDescriptor(frozen, "PI"));


// 10. Extend a built-in with Object.create (without class extends)
function createStack(initial = []) {
  const stack = Object.create({
    push(val)  { this.items.push(val); return this; },
    pop()      { return this.items.pop(); },
    peek()     { return this.items[this.items.length - 1]; },
    get size() { return this.items.length; },
    isEmpty()  { return this.items.length === 0; },
    toArray()  { return [...this.items]; },
    [Symbol.iterator]() { return this.items[Symbol.iterator](); },
  });
  stack.items = [...initial];
  return stack;
}

const s = createStack([1, 2]);
s.push(3).push(4);
console.log(s.peek());    // 4
console.log(s.size);      // 4
console.log(s.pop());     // 4
console.log([...s]);      // [1, 2, 3]
