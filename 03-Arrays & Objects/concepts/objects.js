// --- Object literals ---

const user = {
  id: 1,
  name: "Alex",
  age: 28,
  address: {
    city: "NYC",
    zip: "10001",
  },
  greet() {
    return `Hi, I'm ${this.name}`;
  },
};


// --- Reading and writing ---

user.name;           // dot notation
user["age"];         // bracket notation — needed for dynamic keys
user.address.city;   // nested access

user.email = "alex@example.com"; // add new property
user.age = 29;                   // update
delete user.address;             // remove


// --- Property shorthand ---

const name = "Jordan";
const age  = 30;

const person = { name, age }; // same as { name: name, age: age }


// --- Computed property names ---

const key  = "score";
const data1 = { [key]: 100 };    // { score: 100 }

const prefix = "user";
const record = {
  [`${prefix}Id`]:   1,
  [`${prefix}Name`]: "Alex",
};
// { userId: 1, userName: "Alex" }


// --- Methods shorthand ---

const calc = {
  value: 0,
  add(n)      { this.value += n; return this; }, // return this for chaining
  subtract(n) { this.value -= n; return this; },
  result()    { return this.value; },
};

calc.add(10).add(5).subtract(3).result(); // 12


// --- Object.keys / values / entries ---

const config = { host: "localhost", port: 3000, debug: true };

Object.keys(config);    // ["host", "port", "debug"]
Object.values(config);  // ["localhost", 3000, true]
Object.entries(config); // [["host","localhost"], ["port",3000], ["debug",true]]

// Iterating
for (const [key, value] of Object.entries(config)) {
  console.log(`${key}: ${value}`);
}

// Transform object values
const doubled = Object.fromEntries(
  Object.entries({ a: 1, b: 2, c: 3 }).map(([k, v]) => [k, v * 2])
);
// { a: 2, b: 4, c: 6 }


// --- Object.assign ---

const defaults = { theme: "light", lang: "en", debug: false };
const userPrefs = { theme: "dark", debug: true };

const settings = Object.assign({}, defaults, userPrefs);
// { theme: "dark", lang: "en", debug: true }
// first arg is the target — use {} to avoid mutating defaults


// --- Object.freeze / seal ---

const constants = Object.freeze({ PI: 3.14159, E: 2.718 });
constants.PI = 99; // silently fails (throws in strict mode)

const locked = Object.seal({ name: "Alex" });
locked.name = "Jordan"; // allowed — can update existing
locked.age = 30;        // silently fails — can't add new props


// --- Checking properties ---

"name" in user;                    // true — checks own + inherited
user.hasOwnProperty("name");       // true — own properties only
Object.hasOwn(user, "name");       // true — modern version (ES2022)
user.email !== undefined;          // fragile — field might exist but be undefined


// --- Optional chaining on objects ---

const data = { user: { profile: { avatar: "img.jpg" } } };

data.user?.profile?.avatar;       // "img.jpg"
data.user?.settings?.theme;       // undefined — no error
data.user?.settings?.theme ?? "light"; // "light"
