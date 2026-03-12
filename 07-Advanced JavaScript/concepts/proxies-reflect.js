// A Proxy wraps an object and intercepts fundamental operations
// (property access, assignment, deletion, function calls, etc.)
// via trap functions defined in a handler object.
//
// Reflect mirrors the same operations as plain functions —
// used inside traps to forward to the original object without recursion.


// ── Basic Proxy structure ──

const target  = { name: "Alex", age: 30 };
const handler = {
  get(target, key, receiver) {
    console.log(`get: ${key}`);
    return Reflect.get(target, key, receiver); // forward to original
  },
  set(target, key, value, receiver) {
    console.log(`set: ${key} = ${value}`);
    return Reflect.set(target, key, value, receiver);
  },
};

const proxy = new Proxy(target, handler);
proxy.name;        // logs "get: name", returns "Alex"
proxy.age = 31;    // logs "set: age = 31"


// ── Validation proxy ──

function createValidated(schema) {
  return new Proxy({}, {
    set(target, key, value) {
      const rule = schema[key];
      if (!rule) throw new TypeError(`Unknown field: ${key}`);

      if (rule.type && typeof value !== rule.type) {
        throw new TypeError(`${key} must be ${rule.type}, got ${typeof value}`);
      }
      if (rule.min !== undefined && value < rule.min) {
        throw new RangeError(`${key} must be >= ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        throw new RangeError(`${key} must be <= ${rule.max}`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        throw new Error(`${key} doesn't match required pattern`);
      }

      return Reflect.set(target, key, value);
    },
  });
}

const user = createValidated({
  name:  { type: "string" },
  age:   { type: "number", min: 0, max: 150 },
  email: { type: "string", pattern: /^[^@]+@[^@]+\.[^@]+$/ },
});

user.name  = "Alex";          // ok
user.age   = 30;              // ok
// user.age = -1;             // RangeError: age must be >= 0
// user.email = "notanemail"; // Error: email doesn't match required pattern


// ── Default values proxy ──

function withDefaults(target, defaults) {
  return new Proxy(target, {
    get(t, key, receiver) {
      const val = Reflect.get(t, key, receiver);
      return val !== undefined ? val : defaults[key];
    },
  });
}

const config = withDefaults(
  { timeout: 5000 },
  { timeout: 3000, retries: 3, baseUrl: "/api" }
);

config.timeout; // 5000 — own value
config.retries; // 3    — from defaults
config.baseUrl; // "/api"


// ── Revocable proxy — for temporary access ──

const secret = { token: "abc123" };
const { proxy: tokenProxy, revoke } = Proxy.revocable(secret, {
  get(target, key) {
    console.log(`accessed: ${key}`);
    return Reflect.get(target, key);
  },
});

tokenProxy.token; // "abc123"
revoke();
// tokenProxy.token; // TypeError: Cannot perform 'get' on a proxy that has been revoked


// ── Reflect API ──
// Reflect has a static method for each proxy trap.
// Useful for: forwarding in traps, replacing try/catch with boolean returns.

Reflect.get(obj, key);
Reflect.set(obj, key, value);
Reflect.has(obj, key);             // same as `key in obj`
Reflect.deleteProperty(obj, key);  // same as `delete obj[key]`
Reflect.ownKeys(obj);              // all own keys including Symbols
Reflect.defineProperty(obj, key, descriptor);
Reflect.getPrototypeOf(obj);
Reflect.setPrototypeOf(obj, proto);
Reflect.apply(fn, thisArg, args);
Reflect.construct(Ctor, args);     // same as `new Ctor(...args)`

// Reflect.set returns a boolean — useful in strict mode traps
// (must return true from set trap or TypeError is thrown)

const handler2 = {
  set(target, key, value, receiver) {
    if (typeof value !== "string") return false; // reject
    return Reflect.set(target, key, value, receiver);
  },
};


// ── Observable object — track all reads and writes ──

function makeObservable(target) {
  const log = [];
  const proxy = new Proxy(target, {
    get(t, key, receiver) {
      if (key === "_log") return log;
      log.push({ op: "get", key, at: Date.now() });
      return Reflect.get(t, key, receiver);
    },
    set(t, key, value, receiver) {
      log.push({ op: "set", key, value, prev: t[key], at: Date.now() });
      return Reflect.set(t, key, value, receiver);
    },
    deleteProperty(t, key) {
      log.push({ op: "delete", key, at: Date.now() });
      return Reflect.deleteProperty(t, key);
    },
  });
  return proxy;
}

const observed = makeObservable({ x: 1, y: 2 });
observed.x;         // read
observed.z = 99;    // write
delete observed.y;  // delete
observed._log;      // [{op:"get",key:"x",...}, {op:"set",key:"z",...}, ...]


// ── Function proxy — intercept calls ──

function withLogging(fn, name = fn.name) {
  return new Proxy(fn, {
    apply(target, thisArg, args) {
      console.time(name);
      const result = Reflect.apply(target, thisArg, args);
      console.timeEnd(name);
      console.log(`${name}(${args.join(", ")}) → ${result}`);
      return result;
    },
  });
}

const add  = (a, b) => a + b;
const loggedAdd = withLogging(add);
loggedAdd(2, 3); // logs timing and result


// ── Constructor proxy — intercept new ──

function trackInstances(Ctor) {
  const instances = new WeakSet();
  const proxy = new Proxy(Ctor, {
    construct(target, args, newTarget) {
      const instance = Reflect.construct(target, args, newTarget);
      instances.add(instance);
      console.log(`Created ${Ctor.name} — total: ...`);
      return instance;
    },
  });
  proxy.hasInstance = (obj) => instances.has(obj);
  return proxy;
}
