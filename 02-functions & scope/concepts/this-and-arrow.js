// `this` refers to the object that called the function.
// The tricky part: it's determined at call time, not at definition time.


// --- Default binding (standalone call) ---
function showThis() {
  console.log(this); // global object in non-strict, undefined in strict mode
}
showThis();


// --- Implicit binding (method call) ---
const user = {
  name: "Alex",
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  },
};

user.greet(); // "Hi, I'm Alex" — this = user


// --- Losing `this` ---
const greet = user.greet;
greet(); // this.name is undefined — this is now global, not user


// --- Explicit binding ---
function introduce(role) {
  console.log(`${this.name} is a ${role}`);
}

const person = { name: "Jordan" };

introduce.call(person, "developer");        // calls immediately
introduce.apply(person, ["developer"]);     // same but args as array
const boundIntroduce = introduce.bind(person); // returns new function
boundIntroduce("designer");


// --- new binding ---
function Dog(name) {
  this.name = name;
  this.bark = function() {
    console.log(`${this.name} says woof`);
  };
}

const rex = new Dog("Rex");
rex.bark(); // "Rex says woof"


// --- Arrow functions and `this` ---
// Arrow functions don't have their own `this`.
// They inherit `this` from the surrounding scope at definition time.

const timer = {
  name: "countdown",
  start() {
    // `this` here is `timer`

    // regular function loses `this` in the callback
    // setTimeout(function() {
    //   console.log(this.name); // undefined
    // }, 100);

    // arrow function inherits `this` from start()
    setTimeout(() => {
      console.log(this.name); // "countdown" — works
    }, 100);
  },
};

timer.start();


// Another common pattern — arrow in class/object method

class Button {
  constructor(label) {
    this.label = label;
    this.clicks = 0;
  }

  // handleClick as arrow — `this` is always the Button instance
  handleClick = () => {
    this.clicks++;
    console.log(`${this.label} clicked ${this.clicks} times`);
  };
}

const btn = new Button("Submit");
const handler = btn.handleClick;
handler(); // works — `this` is still the Button instance


// --- When NOT to use arrow functions ---

// 1. Object methods — you want `this` to be the object
const counter = {
  count: 0,
  // don't do this:
  // increment: () => this.count++,  // `this` is not counter

  increment() { // do this
    this.count++;
  },
};

// 2. Event listeners where you need `this` to be the element
// element.addEventListener('click', () => {
//   this.classList.toggle('active'); // `this` is not the element
// });

// 3. Constructor functions — arrow functions can't be used with `new`
