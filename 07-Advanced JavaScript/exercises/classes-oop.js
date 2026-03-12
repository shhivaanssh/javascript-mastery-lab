// ── 1. Build a fully encapsulated Stack class ──

class Stack {
  #items = [];
  #maxSize;

  constructor(maxSize = Infinity) {
    this.#maxSize = maxSize;
  }

  push(value) {
    if (this.#items.length >= this.#maxSize) throw new Error("Stack overflow");
    this.#items.push(value);
    return this;
  }

  pop() {
    if (this.isEmpty()) throw new Error("Stack underflow");
    return this.#items.pop();
  }

  peek()     { return this.#items.at(-1); }
  get size() { return this.#items.length; }
  isEmpty()  { return this.#items.length === 0; }
  clear()    { this.#items = []; return this; }
  toArray()  { return [...this.#items]; }

  [Symbol.iterator]() { return this.#items[Symbol.iterator](); }
  [Symbol.toPrimitive](hint) {
    return hint === "string"
      ? `Stack(${this.#items.join(", ")})`
      : this.size;
  }

  static from(iterable) {
    const s = new Stack();
    for (const item of iterable) s.push(item);
    return s;
  }
}

const s = Stack.from([1, 2, 3]);
s.push(4).push(5);
console.log(`${s}`);    // "Stack(1, 2, 3, 4, 5)"
console.log(+s);        // 5
console.log([...s]);    // [1, 2, 3, 4, 5]
console.log(s.pop());   // 5


// ── 2. Inheritance chain — Shape → Polygon → Triangle ──

class Shape2 {
  #color;

  constructor(color = "black") { this.#color = color; }

  get color() { return this.#color; }

  area()      { throw new Error(`${this.constructor.name} must implement area()`); }
  perimeter() { throw new Error(`${this.constructor.name} must implement perimeter()`); }

  describe() {
    return `${this.constructor.name} [${this.#color}] — area: ${this.area().toFixed(2)}, perimeter: ${this.perimeter().toFixed(2)}`;
  }

  static compare(a, b) { return a.area() - b.area(); }
}

class Circle2 extends Shape2 {
  #r;
  constructor(r, color) { super(color); this.#r = r; }
  area()      { return Math.PI * this.#r ** 2; }
  perimeter() { return 2 * Math.PI * this.#r; }
  get radius(){ return this.#r; }
}

class Rectangle extends Shape2 {
  #w; #h;
  constructor(w, h, color) { super(color); this.#w = w; this.#h = h; }
  area()       { return this.#w * this.#h; }
  perimeter()  { return 2 * (this.#w + this.#h); }
  get isSquare(){ return this.#w === this.#h; }
}

class Triangle extends Rectangle {
  // Right triangle inheriting from Rectangle for width/height
  area() { return super.area() / 2; }
}

const shapes = [new Circle2(5), new Rectangle(4, 6), new Triangle(3, 4)];
shapes.forEach(s => console.log(s.describe()));
shapes.sort(Shape2.compare);
console.log("smallest area:", shapes[0].constructor.name);


// ── 3. Mixin pattern with classes ──

const Serializable = (Base) => class extends Base {
  toJSON()   { return JSON.stringify(this); }
  toString() { return `${this.constructor.name}(${JSON.stringify(this)})`; }
  static fromJSON(json) {
    return Object.assign(new this(), JSON.parse(json));
  }
};

const Validatable = (Base) => class extends Base {
  #errors = [];

  get isValid()  { return this.#errors.length === 0; }
  get errors()   { return [...this.#errors]; }

  addError(msg)  { this.#errors.push(msg); }
  clearErrors()  { this.#errors = []; }

  validate()     { return this.isValid; } // override in subclass
};

const Observable2 = (Base) => class extends Base {
  #handlers = new Map();

  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event).push(fn);
    return () => {
      const fns = this.#handlers.get(event);
      this.#handlers.set(event, fns.filter(f => f !== fn));
    };
  }

  emit(event, ...args) {
    this.#handlers.get(event)?.forEach(fn => fn(...args));
  }
};

class User extends Serializable(Validatable(Observable2(class {}))) {
  constructor({ name = "", email = "" } = {}) {
    super();
    this.name  = name;
    this.email = email;
  }

  validate() {
    this.clearErrors();
    if (!this.name)                this.addError("Name required");
    if (!this.email.includes("@")) this.addError("Invalid email");
    return this.isValid;
  }

  update(data) {
    Object.assign(this, data);
    this.emit("change", this);
    return this;
  }
}

const user = new User({ name: "Alex", email: "alex@example.com" });
const off = user.on("change", u => console.log("changed:", u.name));

user.validate();             // true
user.update({ name: "Jo" }); // triggers "changed"
console.log(user.toJSON());
off(); // unsubscribe


// ── 4. Getter/setter with lazy computation and caching ──

class Matrix {
  #data;
  #rows;
  #cols;
  #determinantCache = null;

  constructor(data) {
    this.#rows = data.length;
    this.#cols = data[0].length;
    this.#data = data.map(row => [...row]);
  }

  get rows()    { return this.#rows; }
  get cols()    { return this.#cols; }
  get isSquare(){ return this.#rows === this.#cols; }

  get(r, c)     { return this.#data[r][c]; }

  set(r, c, v) {
    this.#data[r][c] = v;
    this.#determinantCache = null; // invalidate cache on mutation
    return this;
  }

  // Lazy — only computed once, then cached
  get determinant() {
    if (!this.isSquare) throw new Error("Non-square matrix");
    if (this.#determinantCache !== null) return this.#determinantCache;

    const det = (m) => {
      if (m.length === 1) return m[0][0];
      if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
      return m[0].reduce((sum, val, j) => {
        const sub = m.slice(1).map(row => row.filter((_, c) => c !== j));
        return sum + val * (j % 2 === 0 ? 1 : -1) * det(sub);
      }, 0);
    };

    this.#determinantCache = det(this.#data);
    return this.#determinantCache;
  }

  toString() {
    return this.#data.map(row => row.join("\t")).join("\n");
  }

  static identity(n) {
    return new Matrix(
      Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
      )
    );
  }
}

const m = new Matrix([[1, 2], [3, 4]]);
console.log(m.determinant); // -2
m.set(0, 0, 2);
console.log(m.determinant); // -2 → new: 2*4 - 2*3 = 2


// ── 5. Static factory methods ──
// Why: constructors always return `this`. Factories can return subtypes,
//      return cached instances, do async setup, or provide named constructors.

class Color {
  #r; #g; #b; #a;

  constructor(r, g, b, a = 1) {
    this.#r = Math.min(255, Math.max(0, r));
    this.#g = Math.min(255, Math.max(0, g));
    this.#b = Math.min(255, Math.max(0, b));
    this.#a = Math.min(1, Math.max(0, a));
  }

  // Named constructors — self-documenting and type-converting
  static rgb(r, g, b)        { return new Color(r, g, b); }
  static rgba(r, g, b, a)    { return new Color(r, g, b, a); }
  static hex(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return new Color((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  static hsl(h, s, l) {
    // Convert HSL to RGB
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return new Color(Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255));
  }

  lighten(amount) { return new Color(this.#r + amount, this.#g + amount, this.#b + amount, this.#a); }
  darken(amount)  { return this.lighten(-amount); }
  withAlpha(a)    { return new Color(this.#r, this.#g, this.#b, a); }

  toHex() {
    return "#" + [this.#r, this.#g, this.#b].map(v => v.toString(16).padStart(2, "0")).join("");
  }
  toString() { return `rgba(${this.#r}, ${this.#g}, ${this.#b}, ${this.#a})`; }
}

const red   = Color.hex("#ff0000");
const blue  = Color.hsl(240, 100, 50);
console.log(red.toHex());       // #ff0000
console.log(`${blue}`);         // rgba(0, 0, 255, 1)
console.log(red.lighten(30).toHex());
