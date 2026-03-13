// Structural patterns deal with object composition.
// They describe ways to assemble objects and classes into larger structures
// while keeping those structures flexible and efficient.


// ════════════════════════════════════════════════════════
// MODULE PATTERN
// Encapsulate related code with private state and a public API.
// ════════════════════════════════════════════════════════

// IIFE module (pre-ESM)
const CartModule = (() => {
  // private
  let items = [];
  let discountCode = null;

  function subtotal() {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  // public API
  return {
    add(product)   { items.push({ ...product, qty: 1 }); },
    remove(id)     { items = items.filter(i => i.id !== id); },
    applyDiscount(code) { discountCode = code; },
    total() {
      const sub = subtotal();
      return discountCode === "SAVE10" ? sub * 0.9 : sub;
    },
    itemCount() { return items.length; },
  };
})();

CartModule.add({ id: 1, name: "Book", price: 20 });
CartModule.add({ id: 2, name: "Pen",  price: 2 });
console.log(CartModule.total()); // 22
// CartModule.items — undefined, private!

// Modern ESM modules achieve the same naturally:
// Everything in a file is private unless exported.


// ════════════════════════════════════════════════════════
// DECORATOR PATTERN
// Attach new behaviours to objects by wrapping them.
// Alternative to subclassing for extending functionality.
// ════════════════════════════════════════════════════════

// Function decorators
function withLogging(fn) {
  return function(...args) {
    console.log(`→ ${fn.name}(${args.join(", ")})`);
    const result = fn.apply(this, args);
    console.log(`← ${fn.name} = ${result}`);
    return result;
  };
}

function withTiming(fn) {
  return function(...args) {
    const t = performance.now();
    const result = fn.apply(this, args);
    console.log(`${fn.name} took ${(performance.now() - t).toFixed(2)}ms`);
    return result;
  };
}

function withMemo(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

function add(a, b) { return a + b; }
const loggedAdd = withLogging(withTiming(add));
loggedAdd(2, 3); // → add(2, 3)  [timing]  ← add = 5

// Object/class decorator
class FileStorage {
  read(path)        { return `content of ${path}`; }
  write(path, data) { console.log(`writing to ${path}`); }
}

class CachedStorage {
  #inner;
  #cache = new Map();

  constructor(storage) { this.#inner = storage; }

  read(path) {
    if (this.#cache.has(path)) {
      console.log(`cache hit: ${path}`);
      return this.#cache.get(path);
    }
    const data = this.#inner.read(path);
    this.#cache.set(path, data);
    return data;
  }

  write(path, data) {
    this.#cache.delete(path); // invalidate
    return this.#inner.write(path, data);
  }
}

class LoggedStorage {
  #inner;
  constructor(storage) { this.#inner = storage; }
  read(path)        { console.log(`read: ${path}`); return this.#inner.read(path); }
  write(path, data) { console.log(`write: ${path}`); return this.#inner.write(path, data); }
}

// Stack decorators: LoggedStorage wraps CachedStorage wraps FileStorage
const storage = new LoggedStorage(new CachedStorage(new FileStorage()));
storage.read("/config.json");
storage.read("/config.json"); // second call — from cache


// ════════════════════════════════════════════════════════
// FACADE PATTERN
// Provide a simplified interface to a complex subsystem.
// ════════════════════════════════════════════════════════

// Complex subsystem classes
class VideoEncoder   { encode(file, format)  { return `${file}.${format}`; } }
class ThumbnailGen   { generate(file, time)  { return `thumb_${file}_${time}s.jpg`; } }
class CdnUploader    { upload(file, cdn)     { return `https://cdn.example.com/${file}`; } }
class MetadataWriter { write(file, meta)     { return { file, ...meta }; } }

// Facade — one simple method hides all the complexity
class VideoProcessingFacade {
  #encoder   = new VideoEncoder();
  #thumbGen  = new ThumbnailGen();
  #uploader  = new CdnUploader();
  #metadata  = new MetadataWriter();

  async process(rawFile, { title, author, format = "mp4", cdnRegion = "us" } = {}) {
    const encoded  = this.#encoder.encode(rawFile, format);
    const thumb    = this.#thumbGen.generate(rawFile, 2);
    const videoUrl = this.#uploader.upload(encoded, cdnRegion);
    const thumbUrl = this.#uploader.upload(thumb, cdnRegion);
    const meta     = this.#metadata.write(encoded, { title, author, videoUrl, thumbUrl });

    return meta; // caller doesn't need to know about subsystems
  }
}

const processor = new VideoProcessingFacade();
processor.process("raw_interview.mov", { title: "JS Interview Tips", author: "Alex" })
  .then(console.log);


// ════════════════════════════════════════════════════════
// PROXY PATTERN (structural)
// Provide a substitute or placeholder for another object
// to control access to it.
// ════════════════════════════════════════════════════════

// Virtual proxy — lazy initialisation of expensive resource
class HeavyReport {
  constructor(id) {
    console.log(`Loading report ${id} from database...`); // expensive
    this.id   = id;
    this.data = new Array(10000).fill(id);
  }
  render() { return `Report ${this.id}: ${this.data.length} rows`; }
}

class LazyReport {
  #id;
  #real = null;

  constructor(id) { this.#id = id; }

  render() {
    // Only create the real object when first needed
    if (!this.#real) this.#real = new HeavyReport(this.#id);
    return this.#real.render();
  }
}

const report = new LazyReport(42); // No DB call yet
// ... much later ...
report.render(); // NOW the DB call happens


// Protection proxy — access control
class SecureUserService {
  #service;
  #currentRole;

  constructor(service, role) {
    this.#service     = service;
    this.#currentRole = role;
  }

  getUser(id) {
    return this.#service.getUser(id); // all roles can read
  }

  deleteUser(id) {
    if (this.#currentRole !== "admin") {
      throw new Error("403 Forbidden — admin only");
    }
    return this.#service.deleteUser(id);
  }

  updateUser(id, data) {
    if (!["admin", "moderator"].includes(this.#currentRole)) {
      throw new Error("403 Forbidden");
    }
    return this.#service.updateUser(id, data);
  }
}


// ════════════════════════════════════════════════════════
// ADAPTER PATTERN
// Convert one interface to another that clients expect.
// ════════════════════════════════════════════════════════

// Old API we can't change
class OldPaymentAPI {
  makePayment(cents, cardNumber) {
    return { success: true, transactionId: `old_${Date.now()}`, amount: cents };
  }
}

// New interface our app expects
class PaymentAdapter {
  #legacy;
  constructor() { this.#legacy = new OldPaymentAPI(); }

  charge({ amount, currency, card }) {
    const cents = Math.round(amount * 100);
    const result = this.#legacy.makePayment(cents, card.number);
    return {
      ok:     result.success,
      id:     result.transactionId,
      amount: result.amount / 100,
      currency,
    };
  }
}

const payment = new PaymentAdapter();
payment.charge({ amount: 49.99, currency: "USD", card: { number: "4111..." } });
