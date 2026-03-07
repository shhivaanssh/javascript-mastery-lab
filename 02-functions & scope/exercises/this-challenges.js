// Predict the output, then verify.


// 1 — what does `this` refer to?
const car = {
  brand: "Toyota",
  getBrand() {
    return this.brand;
  },
};

const fn = car.getBrand;
console.log(car.getBrand()); // ?
console.log(fn());           // ?
// actual: "Toyota", undefined (or TypeError in strict mode)


// 2 — fix the lost `this` three different ways
const timer = {
  seconds: 0,
  start() {
    // Option A: store `this` in a variable
    const self = this;
    setInterval(function() {
      self.seconds++;
    }, 1000);

    // Option B: bind
    setInterval(function() {
      this.seconds++;
    }.bind(this), 1000);

    // Option C: arrow function (cleanest)
    setInterval(() => {
      this.seconds++;
    }, 1000);
  },
};


// 3 — call, apply, bind
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const user = { name: "Alex" };

greet.call(user, "Hello", "!");     // ?
greet.apply(user, ["Hey", "."]);    // ?
const boundGreet = greet.bind(user, "Hi");
boundGreet("?");                    // ?
// actual: "Hello, Alex!", "Hey, Alex.", "Hi, Alex?"


// 4 — new binding
function Animal(name, sound) {
  this.name = name;
  this.sound = sound;
  this.speak = function() {
    return `${this.name} says ${this.sound}`;
  };
}

const cat = new Animal("Cat", "meow");
const dog = new Animal("Dog", "woof");

cat.speak(); // ?
dog.speak(); // ?
// actual: "Cat says meow", "Dog says woof"


// 5 — arrow in class field vs method
class Button {
  label = "Click me";

  // arrow class field — `this` always refers to instance
  handleClickArrow = () => {
    return this.label;
  };

  // regular method — `this` depends on how it's called
  handleClickMethod() {
    return this.label;
  }
}

const btn = new Button();
const { handleClickArrow, handleClickMethod } = btn;

handleClickArrow();  // ?
// handleClickMethod(); // ?
// actual: "Click me", TypeError (this is undefined)


// 6 — Build a `bind` from scratch
Function.prototype.myBind = function(context, ...preset) {
  const fn = this;
  return function(...args) {
    return fn.apply(context, [...preset, ...args]);
  };
};

function multiply(a, b) {
  return a * b;
}

const double = multiply.myBind(null, 2);
double(5);  // 10
double(10); // 20
