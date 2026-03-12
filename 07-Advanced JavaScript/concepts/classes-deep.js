// Classes are syntactic sugar over prototype-based inheritance.
// Under the hood, a class method is just a function on the prototype.


// ── Basic class ──

class Shape {
  // Public class field (ES2022)
  color = "black";

  // Private field — only accessible inside the class body
  #area = 0;

  constructor(color) {
    this.color = color;
  }

  // Instance method — lives on Shape.prototype
  describe() {
    return `A ${this.color} shape with area ${this.#area.toFixed(2)}`;
  }

  // Getter — access like a property
  get area() {
    return this.#area;
  }

  // Setter — assign like a property, validate inside
  set area(value) {
    if (value < 0) throw new RangeError("Area can't be negative");
    this.#area = value;
  }

  // Static — called on the class, not instances
  static fromColor(color) {
    return new Shape(color);
  }

  static isShape(obj) {
    return obj instanceof Shape;
  }
}

const s = new Shape("blue");
s.area = 42;       // setter
s.area;            // 42 — getter
s.describe();      // "A blue shape with area 42.00"
// s.#area         // SyntaxError — private

Shape.fromColor("red"); // static factory
Shape.isShape(s);       // true


// ── Inheritance ──

class Circle extends Shape {
  #radius;

  constructor(radius, color = "black") {
    super(color); // must call super() before using `this`
    this.#radius = radius;
    this.area    = Math.PI * radius ** 2; // uses parent setter
  }

  get radius()  { return this.#radius; }

  // Override parent method
  describe() {
    return `Circle r=${this.#radius} — ${super.describe()}`;
    //                                  ↑ calls Shape.describe()
  }

  // Static method on child can call parent static
  static unit() {
    return new Circle(1);
  }
}

const c = new Circle(5, "red");
c.describe();          // "Circle r=5 — A red shape with area 78.54"
c instanceof Circle;   // true
c instanceof Shape;    // true
Circle.isShape(c);     // true — inherited static method


// ── super in depth ──

class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() { return `${this.name} makes a sound`; }
  static create(name) { return new this(name); } // `this` is the class
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);          // Animal.constructor
    this.breed = breed;
  }
  speak() {
    const base = super.speak(); // Animal.prototype.speak
    return `${base} — specifically a woof`;
  }
}

const d = Dog.create("Rex"); // inherited static, `this` = Dog → new Dog("Rex")
d instanceof Dog; // true


// ── Private methods ──

class BankAccount {
  #balance;
  #pin;
  #transactionLog = [];

  constructor(initial, pin) {
    this.#balance = initial;
    this.#pin     = pin;
  }

  #log(type, amount) {
    this.#transactionLog.push({
      type, amount,
      balance: this.#balance,
      at: new Date().toISOString(),
    });
  }

  #verify(pin) {
    if (pin !== this.#pin) throw new Error("Invalid PIN");
  }

  deposit(amount) {
    if (amount <= 0) throw new RangeError("Amount must be positive");
    this.#balance += amount;
    this.#log("deposit", amount);
    return this;
  }

  withdraw(amount, pin) {
    this.#verify(pin);
    if (amount > this.#balance) throw new Error("Insufficient funds");
    this.#balance -= amount;
    this.#log("withdrawal", amount);
    return this;
  }

  get balance() { return this.#balance; }

  get history() { return [...this.#transactionLog]; }
}

const acc = new BankAccount(1000, 1234);
acc.deposit(500).withdraw(200, 1234); // chaining
acc.balance; // 1300


// ── Mixins — composing behavior across classes ──

const Serializable = (Base) => class extends Base {
  serialize()   { return JSON.stringify(this); }
  static deserialize(json) { return Object.assign(new this(), JSON.parse(json)); }
};

const Timestamped = (Base) => class extends Base {
  createdAt = new Date().toISOString();
  touch() { this.updatedAt = new Date().toISOString(); return this; }
};

const Validatable = (Base) => class extends Base {
  #errors = [];
  get errors()  { return [...this.#errors]; }
  get isValid() { return this.#errors.length === 0; }
  addError(msg) { this.#errors.push(msg); return this; }
  clearErrors() { this.#errors = []; return this; }
};

class User extends Serializable(Timestamped(Validatable(class {}))) {
  constructor(name, email) {
    super();
    this.name  = name;
    this.email = email;
  }

  validate() {
    this.clearErrors();
    if (!this.name)  this.addError("Name required");
    if (!this.email.includes("@")) this.addError("Invalid email");
    return this.isValid;
  }
}

const u = new User("Alex", "alex@example.com");
u.validate();     // true
u.serialize();    // JSON string
u.touch();        // sets updatedAt
