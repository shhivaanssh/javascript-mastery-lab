// Every JS object has an internal [[Prototype]] link.
// When you access a property, JS walks this chain until it finds it or hits null.
// This is prototype-based inheritance — different from classical OOP.


// ── The chain ──

const animal = {
  breathe() { return `${this.name} breathes`; },
};

const dog = Object.create(animal); // dog's [[Prototype]] = animal
dog.name = "Rex";
dog.bark = function() { return `${this.name} barks`; };

dog.bark();     // "Rex barks"    — found on dog directly
dog.breathe();  // "Rex breathes" — not on dog, found up the chain on animal

Object.getPrototypeOf(dog) === animal; // true
animal.isPrototypeOf(dog);             // true


// ── Walking the chain manually ──

// dog → animal → Object.prototype → null

// Object.prototype is the top — it has hasOwnProperty, toString, etc.
dog.hasOwnProperty("name");    // true  — own property
dog.hasOwnProperty("breathe"); // false — inherited

"name"    in dog; // true — checks own + inherited
"breathe" in dog; // true


// ── Object.create ──

// Create an object with a specific prototype
const vehicleProto = {
  describe() {
    return `${this.make} ${this.model} (${this.year})`;
  },
  age() {
    return new Date().getFullYear() - this.year;
  },
};

function createVehicle(make, model, year) {
  const v   = Object.create(vehicleProto);
  v.make    = make;
  v.model   = model;
  v.year    = year;
  return v;
}

const car = createVehicle("Toyota", "Camry", 2020);
car.describe(); // "Toyota Camry (2020)"
car.age();      // 5 (approx)

// Object.create(null) — object with NO prototype
const pureMap = Object.create(null);
pureMap.key   = "value";
// pureMap.toString — undefined, no inherited methods
// Useful as a safe hash map that won't conflict with Object.prototype methods


// ── Constructor functions and .prototype ──

function Animal(name, sound) {
  this.name  = name;
  this.sound = sound;
}

// Methods on .prototype are shared across all instances (not copied per instance)
Animal.prototype.speak = function() {
  return `${this.name} says ${this.sound}`;
};

Animal.prototype.toString = function() {
  return `[Animal: ${this.name}]`;
};

const cat  = new Animal("Cat",  "meow");
const duck = new Animal("Duck", "quack");

cat.speak();  // "Cat says meow"
duck.speak(); // "Duck says quack"

// Both share the same speak function — not duplicated in memory
cat.speak === duck.speak; // true

// Instance vs prototype properties
cat.hasOwnProperty("name");  // true  — set in constructor
cat.hasOwnProperty("speak"); // false — lives on Animal.prototype


// ── Prototype chain with constructors ──

function Dog(name) {
  Animal.call(this, name, "woof"); // borrow constructor
}

// Set up prototype chain: Dog.prototype → Animal.prototype
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog; // fix the constructor reference

Dog.prototype.fetch = function(item) {
  return `${this.name} fetches the ${item}`;
};

const rex = new Dog("Rex");
rex.speak();         // "Rex says woof"     — Animal.prototype
rex.fetch("ball");   // "Rex fetches ball"  — Dog.prototype
rex instanceof Dog;    // true
rex instanceof Animal; // true


// ── Property shadowing ──

const base = { x: 1 };
const child = Object.create(base);

child.x;          // 1 — from prototype
child.x = 10;     // creates own property on child, shadows prototype
child.x;          // 10 — own property
base.x;           // 1  — prototype unchanged

Object.getOwnPropertyNames(child); // ["x"] — only own
Object.getOwnPropertyNames(base);  // ["x"]


// ── Inspecting the chain ──

function getChain(obj) {
  const chain = [];
  let current = obj;
  while (current) {
    chain.push(current === Object.prototype ? "Object.prototype" : current);
    current = Object.getPrototypeOf(current);
  }
  return chain;
}

// For rex: [rex, Dog.prototype, Animal.prototype, Object.prototype, null]
