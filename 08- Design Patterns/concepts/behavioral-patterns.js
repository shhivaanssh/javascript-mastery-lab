// Behavioral patterns deal with communication between objects.
// They describe how objects interact and distribute responsibility.


// ════════════════════════════════════════════════════════
// OBSERVER PATTERN
// Define a one-to-many dependency so that when one object
// changes state, all dependents are notified automatically.
// ════════════════════════════════════════════════════════

class EventEmitter {
  #events = new Map();

  on(event, listener) {
    if (!this.#events.has(event)) this.#events.set(event, new Set());
    this.#events.get(event).add(listener);
    // Return unsubscribe function
    return () => this.#events.get(event)?.delete(listener);
  }

  once(event, listener) {
    const off = this.on(event, (...args) => {
      listener(...args);
      off();
    });
    return off;
  }

  emit(event, ...args) {
    this.#events.get(event)?.forEach(fn => fn(...args));
    this.#events.get("*")?.forEach(fn => fn(event, ...args)); // wildcard
  }

  off(event, listener) {
    this.#events.get(event)?.delete(listener);
  }

  listenerCount(event) {
    return this.#events.get(event)?.size ?? 0;
  }
}

class Store extends EventEmitter {
  #state;

  constructor(initial) {
    super();
    this.#state = initial;
  }

  get state() { return this.#state; }

  setState(updater) {
    const prev  = this.#state;
    this.#state = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
    this.emit("change", this.#state, prev);
  }
}

const store = new Store({ count: 0, user: null });
const off   = store.on("change", (next, prev) => {
  console.log("state changed:", prev.count, "→", next.count);
});

store.setState(s => ({ ...s, count: s.count + 1 })); // 0 → 1
store.setState(s => ({ ...s, count: s.count + 1 })); // 1 → 2
off(); // unsubscribe


// ════════════════════════════════════════════════════════
// STRATEGY PATTERN
// Define a family of algorithms, encapsulate each one,
// and make them interchangeable at runtime.
// ════════════════════════════════════════════════════════

// Sorting strategies
const strategies = {
  bubble: (arr) => {
    const a = [...arr];
    for (let i = 0; i < a.length; i++)
      for (let j = 0; j < a.length - i - 1; j++)
        if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    return a;
  },
  quick: (arr) => {
    if (arr.length <= 1) return arr;
    const pivot = arr[arr.length >> 1];
    return [
      ...strategies.quick(arr.filter(x => x < pivot)),
      ...arr.filter(x => x === pivot),
      ...strategies.quick(arr.filter(x => x > pivot)),
    ];
  },
  native: (arr) => [...arr].sort((a, b) => a - b),
};

class Sorter {
  #strategy;
  constructor(strategy = "native") { this.#strategy = strategies[strategy]; }
  setStrategy(name)  { this.#strategy = strategies[name]; return this; }
  sort(arr)          { return this.#strategy(arr); }
}

const sorter = new Sorter("quick");
sorter.sort([3, 1, 4, 1, 5, 9]); // [1, 1, 3, 4, 5, 9]
sorter.setStrategy("native").sort([3, 1, 4]);


// Validation strategies
const validators = {
  required:  (v) => (v == null || v === "") ? "Required" : null,
  email:     (v) => /^[^@]+@[^@]+\.[^@]+$/.test(v) ? null : "Invalid email",
  minLength: (n) => (v) => v.length < n ? `Min ${n} chars` : null,
  maxLength: (n) => (v) => v.length > n ? `Max ${n} chars` : null,
  match:     (other) => (v) => v !== other ? "Values must match" : null,
};

function validate(value, ...rules) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

validate("",         validators.required);            // "Required"
validate("bad",      validators.email);               // "Invalid email"
validate("hi",       validators.minLength(5));        // "Min 5 chars"
validate("ok@a.com", validators.required, validators.email); // null


// ════════════════════════════════════════════════════════
// COMMAND PATTERN
// Encapsulate a request as an object, allowing undo/redo,
// queuing, and logging of operations.
// ════════════════════════════════════════════════════════

class TextEditor {
  #content = "";
  #history = [];
  #redoStack = [];

  get content() { return this.#content; }

  execute(command) {
    command.execute(this);
    this.#history.push(command);
    this.#redoStack = []; // clear redo on new command
    return this;
  }

  undo() {
    const command = this.#history.pop();
    if (!command) return this;
    command.undo(this);
    this.#redoStack.push(command);
    return this;
  }

  redo() {
    const command = this.#redoStack.pop();
    if (!command) return this;
    command.execute(this);
    this.#history.push(command);
    return this;
  }

  // Internal — used by commands
  _setContent(content) { this.#content = content; }
}

class InsertCommand {
  #text; #position; #prev;
  constructor(text, position) { this.#text = text; this.#position = position; }

  execute(editor) {
    this.#prev = editor.content;
    const c    = editor.content;
    editor._setContent(c.slice(0, this.#position) + this.#text + c.slice(this.#position));
  }
  undo(editor) { editor._setContent(this.#prev); }
}

class DeleteCommand {
  #start; #end; #deleted;
  constructor(start, end) { this.#start = start; this.#end = end; }

  execute(editor) {
    this.#deleted = editor.content.slice(this.#start, this.#end);
    const c = editor.content;
    editor._setContent(c.slice(0, this.#start) + c.slice(this.#end));
  }
  undo(editor) {
    const c = editor.content;
    editor._setContent(c.slice(0, this.#start) + this.#deleted + c.slice(this.#start));
  }
}

const editor = new TextEditor();
editor
  .execute(new InsertCommand("Hello World", 0))
  .execute(new InsertCommand("!", 11))
  .execute(new DeleteCommand(5, 11));

console.log(editor.content); // "Hello!"
editor.undo();
console.log(editor.content); // "Hello World!"
editor.undo();
console.log(editor.content); // "Hello World"
editor.redo();
console.log(editor.content); // "Hello World!"


// ════════════════════════════════════════════════════════
// ITERATOR PATTERN (behavioral)
// Provide a way to sequentially access elements of a
// collection without exposing its underlying representation.
// ════════════════════════════════════════════════════════

// Already covered deeply in Module 07 — here's the pattern angle

class TreeIterator {
  #stack = [];

  constructor(root) {
    if (root) this.#stack.push(root);
  }

  [Symbol.iterator]() { return this; }

  next() {
    if (!this.#stack.length) return { value: undefined, done: true };

    const node = this.#stack.pop();
    // Push right first so left is processed first
    if (node.right) this.#stack.push(node.right);
    if (node.left)  this.#stack.push(node.left);

    return { value: node.value, done: false };
  }
}

const tree = {
  value: 1,
  left:  { value: 2, left: { value: 4, left: null, right: null },
                     right: { value: 5, left: null, right: null } },
  right: { value: 3, left: null,
                     right: { value: 6, left: null, right: null } },
};

console.log([...new TreeIterator(tree)]); // [1, 2, 4, 5, 3, 6]


// ════════════════════════════════════════════════════════
// TEMPLATE METHOD PATTERN
// Define the skeleton of an algorithm in a base class,
// deferring some steps to subclasses.
// ════════════════════════════════════════════════════════

class DataExporter {
  // Template method — defines the algorithm structure
  export(data) {
    const validated = this.validate(data);
    const formatted = this.format(validated);
    const output    = this.serialize(formatted);
    this.deliver(output);
    return output;
  }

  validate(data) {
    if (!Array.isArray(data)) throw new TypeError("Data must be an array");
    return data.filter(row => row != null);
  }

  // Subclasses override these
  format(data)   { return data; }
  serialize(data){ throw new Error("implement serialize()"); }
  deliver(output){ console.log("Exported:", output.slice(0, 50) + "..."); }
}

class CSVExporter extends DataExporter {
  format(data) {
    return data.map(row => Object.values(row).join(","));
  }
  serialize(rows) {
    return rows.join("\n");
  }
}

class JSONExporter extends DataExporter {
  serialize(data) {
    return JSON.stringify(data, null, 2);
  }
}

const data = [{ name: "Alex", age: 30 }, { name: "Jo", age: 25 }];
new CSVExporter().export(data);  // "Alex,30\nJo,25"
new JSONExporter().export(data); // pretty JSON
