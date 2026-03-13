// ── 1. Singleton — connection pool ──
// Build a ConnectionPool singleton that manages a fixed set of
// reusable database connections.

class ConnectionPool {
  static #instance = null;
  #pool = [];
  #inUse = new Set();
  #maxSize;

  constructor(maxSize = 5) {
    if (ConnectionPool.#instance) throw new Error("Use ConnectionPool.getInstance()");
    this.#maxSize = maxSize;
    for (let i = 0; i < maxSize; i++) {
      this.#pool.push({ id: i, query: (sql) => `result of: ${sql}` });
    }
  }

  static getInstance(maxSize = 5) {
    if (!ConnectionPool.#instance) ConnectionPool.#instance = new ConnectionPool(maxSize);
    return ConnectionPool.#instance;
  }

  acquire() {
    const conn = this.#pool.find(c => !this.#inUse.has(c.id));
    if (!conn) throw new Error("No connections available");
    this.#inUse.add(conn.id);
    return conn;
  }

  release(conn) {
    this.#inUse.delete(conn.id);
  }

  get available() { return this.#maxSize - this.#inUse.size; }
  get total()     { return this.#maxSize; }

  static reset() { ConnectionPool.#instance = null; } // for testing
}

const pool1 = ConnectionPool.getInstance();
const pool2 = ConnectionPool.getInstance();
console.log(pool1 === pool2); // true

const conn = pool1.acquire();
console.log(pool1.available); // 4
pool1.release(conn);
console.log(pool1.available); // 5


// ── 2. Factory — shape renderer ──
// createShape(type, props) returns a shape object with area(), perimeter(), draw()

function createShape(type, props) {
  const shapes = {
    circle: ({ r }) => ({
      type: "circle",
      area:      () => +(Math.PI * r ** 2).toFixed(2),
      perimeter: () => +(2 * Math.PI * r).toFixed(2),
      draw:      () => `○  circle(r=${r})`,
    }),
    rectangle: ({ w, h }) => ({
      type: "rectangle",
      area:      () => w * h,
      perimeter: () => 2 * (w + h),
      draw:      () => `□  rect(${w}×${h})`,
    }),
    triangle: ({ a, b, c }) => {
      const s = (a + b + c) / 2;
      return {
        type: "triangle",
        area:      () => +Math.sqrt(s * (s-a) * (s-b) * (s-c)).toFixed(2),
        perimeter: () => a + b + c,
        draw:      () => `△  triangle(${a},${b},${c})`,
      };
    },
  };

  if (!shapes[type]) throw new TypeError(`Unknown shape: ${type}`);
  return shapes[type](props);
}

const shapes = [
  createShape("circle",    { r: 5 }),
  createShape("rectangle", { w: 4, h: 6 }),
  createShape("triangle",  { a: 3, b: 4, c: 5 }),
];

shapes.forEach(s => console.log(s.draw(), `area=${s.area()}`));


// ── 3. Builder — email builder ──

class EmailBuilder {
  #email = { to: [], cc: [], bcc: [], attachments: [], headers: {} };

  from(address)         { this.#email.from    = address;  return this; }
  to(...addresses)      { this.#email.to.push(...addresses); return this; }
  cc(...addresses)      { this.#email.cc.push(...addresses); return this; }
  bcc(...addresses)     { this.#email.bcc.push(...addresses); return this; }
  subject(text)         { this.#email.subject = text;     return this; }
  body(text)            { this.#email.body    = text;     return this; }
  html(markup)          { this.#email.html    = markup;   return this; }
  attach(name, content) { this.#email.attachments.push({ name, content }); return this; }
  header(key, value)    { this.#email.headers[key] = value; return this; }
  priority(level)       { return this.header("X-Priority", level); }

  build() {
    if (!this.#email.from)         throw new Error("From is required");
    if (!this.#email.to.length)    throw new Error("At least one To is required");
    if (!this.#email.subject)      throw new Error("Subject is required");
    if (!this.#email.body && !this.#email.html) throw new Error("Body is required");
    return { ...this.#email };
  }
}

const email = new EmailBuilder()
  .from("sender@example.com")
  .to("alice@example.com", "bob@example.com")
  .cc("manager@example.com")
  .subject("Project Update")
  .body("Please see the attached report.")
  .attach("report.pdf", "<binary>")
  .priority("1")
  .build();

console.log(email.to);     // ["alice@example.com", "bob@example.com"]
console.log(email.attachments.length); // 1


// ── 4. Abstract factory — cross-platform dialogs ──

function createDialogFactory(platform) {
  const platforms = {
    web: {
      alert:   (msg)       => ({ platform: "web", type: "alert",   html: `<div class="alert">${msg}</div>` }),
      confirm: (msg)       => ({ platform: "web", type: "confirm", html: `<div class="confirm">${msg}</div>` }),
      prompt:  (msg, hint) => ({ platform: "web", type: "prompt",  html: `<input placeholder="${hint}">` }),
    },
    native: {
      alert:   (msg)       => ({ platform: "native", type: "alert",   command: `dialog --msgbox "${msg}"` }),
      confirm: (msg)       => ({ platform: "native", type: "confirm", command: `dialog --yesno "${msg}"` }),
      prompt:  (msg, hint) => ({ platform: "native", type: "prompt",  command: `dialog --inputbox "${msg}" 0 0 "${hint}"` }),
    },
    test: {
      alert:   (msg)       => ({ platform: "test", type: "alert",   logged: msg }),
      confirm: (msg)       => ({ platform: "test", type: "confirm", result: true }),
      prompt:  (msg, hint) => ({ platform: "test", type: "prompt",  result: hint }),
    },
  };

  if (!platforms[platform]) throw new TypeError(`Unknown platform: ${platform}`);
  return platforms[platform];
}

const dialog = createDialogFactory("web");
console.log(dialog.alert("File saved!"));
console.log(dialog.confirm("Delete this file?"));

const testDialog = createDialogFactory("test");
console.log(testDialog.confirm("Are you sure?")); // { result: true } — predictable in tests
