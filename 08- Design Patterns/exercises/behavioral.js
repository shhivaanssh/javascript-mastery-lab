// ── 1. Observer — stock price ticker ──

class StockTicker {
  #prices = new Map();
  #subscribers = new Map();

  updatePrice(symbol, price) {
    const prev = this.#prices.get(symbol);
    this.#prices.set(symbol, price);

    if (prev !== undefined) {
      const change = ((price - prev) / prev * 100).toFixed(2);
      this.#notify(symbol, { symbol, price, prev, change: +change });
    }
  }

  subscribe(symbol, fn) {
    if (!this.#subscribers.has(symbol)) this.#subscribers.set(symbol, new Set());
    this.#subscribers.get(symbol).add(fn);
    return () => this.#subscribers.get(symbol).delete(fn);
  }

  subscribeAll(fn) {
    return this.subscribe("*", fn);
  }

  #notify(symbol, data) {
    this.#subscribers.get(symbol)?.forEach(fn => fn(data));
    this.#subscribers.get("*")?.forEach(fn => fn(data));
  }

  getPrice(symbol) { return this.#prices.get(symbol); }
}

const ticker = new StockTicker();
const offAAPL = ticker.subscribe("AAPL", ({ price, change }) => {
  console.log(`AAPL: $${price} (${change > 0 ? "+" : ""}${change}%)`);
});

ticker.subscribeAll(({ symbol, price }) => {
  console.log(`[all] ${symbol} → $${price}`);
});

ticker.updatePrice("AAPL", 180);
ticker.updatePrice("AAPL", 185); // AAPL: $185 (+2.78%)
ticker.updatePrice("GOOG", 140);
offAAPL();
ticker.updatePrice("AAPL", 170); // only [all] fires now


// ── 2. Strategy — payment processor ──

const paymentStrategies = {
  creditCard: {
    name: "Credit Card",
    validate: ({ number, cvv, expiry }) => {
      if (!number || number.replace(/\s/g, "").length !== 16) return "Invalid card number";
      if (!cvv || cvv.length < 3) return "Invalid CVV";
      return null;
    },
    charge: ({ amount, number }) => ({
      ok: true, method: "credit_card",
      last4: number.slice(-4), amount,
      id: `cc_${Date.now()}`,
    }),
  },

  paypal: {
    name: "PayPal",
    validate: ({ email }) => {
      if (!email?.includes("@")) return "Invalid PayPal email";
      return null;
    },
    charge: ({ amount, email }) => ({
      ok: true, method: "paypal",
      email, amount,
      id: `pp_${Date.now()}`,
    }),
  },

  crypto: {
    name: "Crypto",
    validate: ({ wallet }) => {
      if (!wallet || wallet.length < 26) return "Invalid wallet address";
      return null;
    },
    charge: ({ amount, wallet }) => ({
      ok: true, method: "crypto",
      wallet: wallet.slice(0, 8) + "...", amount,
      id: `crypto_${Date.now()}`,
    }),
  },
};

class PaymentProcessor {
  #strategy;

  setMethod(method) {
    if (!paymentStrategies[method]) throw new TypeError(`Unknown method: ${method}`);
    this.#strategy = paymentStrategies[method];
    return this;
  }

  process(details) {
    if (!this.#strategy) throw new Error("No payment method set");
    const error = this.#strategy.validate(details);
    if (error) return { ok: false, error };
    return this.#strategy.charge(details);
  }
}

const processor = new PaymentProcessor();

processor.setMethod("creditCard");
console.log(processor.process({ number: "4111111111111111", cvv: "123", expiry: "12/25", amount: 49.99 }));

processor.setMethod("paypal");
console.log(processor.process({ email: "user@example.com", amount: 49.99 }));


// ── 3. Command — task queue with undo ──

class TaskQueue {
  #history   = [];
  #redoStack = [];
  #running   = false;

  execute(command) {
    const result = command.execute();
    this.#history.push(command);
    this.#redoStack = [];
    return result;
  }

  undo() {
    const cmd = this.#history.pop();
    if (!cmd) { console.log("Nothing to undo"); return; }
    cmd.undo();
    this.#redoStack.push(cmd);
  }

  redo() {
    const cmd = this.#redoStack.pop();
    if (!cmd) { console.log("Nothing to redo"); return; }
    cmd.execute();
    this.#history.push(cmd);
  }

  history() { return this.#history.map(c => c.describe()); }
}

// Commands
const makeAddItemCmd = (list, item) => ({
  execute()    { list.push(item); return item; },
  undo()       { list.splice(list.lastIndexOf(item), 1); },
  describe()   { return `add "${item}"`; },
});

const makeRemoveItemCmd = (list, index) => {
  let removed;
  return {
    execute()  { [removed] = list.splice(index, 1); return removed; },
    undo()     { list.splice(index, 0, removed); },
    describe() { return `remove index ${index} ("${removed}")`; },
  };
};

const makeSortCmd = (list) => {
  let prev;
  return {
    execute()  { prev = [...list]; list.sort(); return list; },
    undo()     { list.splice(0, list.length, ...prev); },
    describe() { return "sort"; },
  };
};

const items = ["banana", "apple"];
const queue = new TaskQueue();

queue.execute(makeAddItemCmd(items, "cherry"));
queue.execute(makeAddItemCmd(items, "date"));
queue.execute(makeSortCmd(items));

console.log([...items]); // ["apple", "banana", "cherry", "date"]
queue.undo();
console.log([...items]); // ["banana", "apple", "cherry", "date"]
queue.undo();
console.log([...items]); // ["banana", "apple", "cherry"]
queue.redo();
console.log([...items]); // ["banana", "apple", "cherry", "date"]
console.log(queue.history());


// ── 4. Template method — report generators ──

class ReportGenerator {
  generate(data) {
    const title    = this.renderTitle(data.title);
    const summary  = this.renderSummary(data.summary);
    const rows     = data.rows.map(row => this.renderRow(row)).join(this.separator());
    const footer   = this.renderFooter(data.rows.length);
    return this.wrap([title, summary, rows, footer].filter(Boolean).join("\n"));
  }

  renderTitle(title)  { return title; }
  renderSummary(s)    { return s || ""; }
  renderRow(row)      { throw new Error("implement renderRow()"); }
  renderFooter(count) { return `Total: ${count} rows`; }
  separator()         { return "\n"; }
  wrap(content)       { return content; }
}

class MarkdownReport extends ReportGenerator {
  renderTitle(t)   { return `# ${t}`; }
  renderSummary(s) { return s ? `> ${s}\n` : ""; }
  renderRow(row)   { return `- **${row.label}**: ${row.value}`; }
  renderFooter(n)  { return `\n---\n*${n} items*`; }
}

class CSVReport extends ReportGenerator {
  #headers = [];
  constructor(headers) { super(); this.#headers = headers; }
  renderTitle()        { return this.#headers.join(","); }
  renderSummary()      { return ""; }
  renderRow(row)       { return Object.values(row).join(","); }
  renderFooter()       { return ""; }
  separator()          { return "\n"; }
}

const data = {
  title:   "Monthly Sales",
  summary: "Summary for March 2026",
  rows: [
    { label: "Revenue",  value: "$12,400" },
    { label: "Orders",   value: "148" },
    { label: "Returns",  value: "12" },
  ],
};

console.log(new MarkdownReport().generate(data));
console.log("---");
