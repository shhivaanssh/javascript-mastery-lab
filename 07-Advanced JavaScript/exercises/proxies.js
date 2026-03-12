// ── 1. Read-only proxy ──
// Prevent any writes to an object (and its nested objects)

function readonly(target) {
  return new Proxy(target, {
    set(_, key) {
      throw new TypeError(`Cannot set "${key}" on read-only object`);
    },
    deleteProperty(_, key) {
      throw new TypeError(`Cannot delete "${key}" on read-only object`);
    },
    get(t, key, receiver) {
      const value = Reflect.get(t, key, receiver);
      // Recursively wrap nested objects
      if (value !== null && typeof value === "object") return readonly(value);
      return value;
    },
  });
}

const config = readonly({ host: "localhost", db: { name: "mydb", port: 5432 } });
console.log(config.host);       // "localhost"
console.log(config.db.port);    // 5432
try { config.host = "other"; } catch (e) { console.log(e.message); }
try { config.db.port = 3306; } catch (e) { console.log(e.message); }


// ── 2. Auto-vivification proxy ──
// Accessing any undefined path auto-creates objects instead of returning undefined

function autoViv() {
  return new Proxy({}, {
    get(target, key) {
      if (!(key in target)) target[key] = autoViv();
      return target[key];
    },
  });
}

const deep = autoViv();
deep.a.b.c.d = 42;
console.log(deep.a.b.c.d); // 42
console.log(typeof deep.x.y.z); // "object" (auto-created)


// ── 3. Negative array index proxy ──
// Allow arr[-1], arr[-2] like Python

function negativeIndex(arr) {
  return new Proxy(arr, {
    get(target, key, receiver) {
      const index = Number(key);
      if (Number.isInteger(index) && index < 0) {
        return Reflect.get(target, target.length + index, receiver);
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const index = Number(key);
      if (Number.isInteger(index) && index < 0) {
        return Reflect.set(target, target.length + index, value, receiver);
      }
      return Reflect.set(target, key, value, receiver);
    },
  });
}

const arr = negativeIndex([1, 2, 3, 4, 5]);
console.log(arr[-1]);  // 5
console.log(arr[-2]);  // 4
arr[-1] = 99;
console.log(arr);      // [1, 2, 3, 4, 99]


// ── 4. Typed property proxy ──
// Enforce types based on initial values

function typed(initial) {
  const types = Object.fromEntries(
    Object.entries(initial).map(([k, v]) => [k, typeof v])
  );

  return new Proxy({ ...initial }, {
    set(target, key, value, receiver) {
      if (key in types && typeof value !== types[key]) {
        throw new TypeError(
          `Property "${key}" must be ${types[key]}, got ${typeof value}`
        );
      }
      return Reflect.set(target, key, value, receiver);
    },
  });
}

const state = typed({ count: 0, name: "default", active: true });
state.count  = 5;       // ok
state.name   = "hello"; // ok
state.active = false;   // ok
try { state.count = "5"; } catch (e) { console.log(e.message); }
// TypeError: Property "count" must be number, got string


// ── 5. Memoize proxy — cache function call results ──

function memoizeProxy(fn) {
  const cache = new Map();
  return new Proxy(fn, {
    apply(target, thisArg, args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        console.log(`cache hit: ${key}`);
        return cache.get(key);
      }
      const result = Reflect.apply(target, thisArg, args);
      cache.set(key, result);
      return result;
    },
  });
}

const slowAdd = (a, b) => {
  let sum = 0;
  for (let i = 0; i < 1e6; i++) sum++;
  return a + b + sum;
};

const fastAdd = memoizeProxy(slowAdd);
fastAdd(1, 2); // computed
fastAdd(1, 2); // "cache hit: [1,2]"
fastAdd(3, 4); // computed
fastAdd(3, 4); // "cache hit: [3,4]"


// ── 6. Observable object — emit events on property change ──

function observable(target) {
  const handlers = new Map();

  const proxy = new Proxy(target, {
    set(t, key, value, receiver) {
      const prev = t[key];
      const result = Reflect.set(t, key, value, receiver);
      if (prev !== value) {
        handlers.get(key)?.forEach(fn => fn(value, prev, key));
        handlers.get("*")?.forEach(fn => fn(value, prev, key));
      }
      return result;
    },
  });

  proxy.$on = (key, fn) => {
    if (!handlers.has(key)) handlers.set(key, []);
    handlers.get(key).push(fn);
    return () => handlers.set(key, handlers.get(key).filter(f => f !== fn));
  };

  return proxy;
}

const user = observable({ name: "Alex", score: 0 });

user.$on("score", (next, prev) => console.log(`score: ${prev} → ${next}`));
user.$on("*",     (val, prev, key) => console.log(`[any] ${key}: ${prev} → ${val}`));

user.name  = "Jordan"; // triggers [any]
user.score = 10;       // triggers score + [any]
user.score = 10;       // no event (same value)
user.score = 20;       // triggers both


// ── 7. Revocable API token ──
// Access an object through a proxy, revoke it after a time limit

function withExpiry(target, ttlMs) {
  const { proxy, revoke } = Proxy.revocable(target, {
    get(t, key, receiver) {
      console.log(`[token] reading ${key}`);
      return Reflect.get(t, key, receiver);
    },
  });

  const timer = setTimeout(() => {
    revoke();
    console.log("[token] expired and revoked");
  }, ttlMs);

  return {
    proxy,
    cancel: () => { clearTimeout(timer); revoke(); },
  };
}

const secret = { apiKey: "abc-123", userId: 42 };
const { proxy: token, cancel } = withExpiry(secret, 200);

console.log(token.apiKey); // [token] reading apiKey → "abc-123"
setTimeout(() => {
  try { console.log(token.userId); }
  catch (e) { console.log("expired:", e.message); }
}, 300);
