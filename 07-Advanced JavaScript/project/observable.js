// Observable — a stream of values over time.
// Modelled after the TC39 Observable proposal and RxJS concepts.
// Core idea: an Observable is a lazy push collection.
//   - Lazy:  nothing runs until you .subscribe()
//   - Push:  the producer decides when to send values (contrast with pull = iterator)
//   - Multi-value: can emit 0 to N values, then optionally complete or error


// ── Subscriber — manages a single subscription ──

export class Subscriber {
  #next;
  #error;
  #complete;
  #closed = false;
  #teardowns = [];

  constructor({ next, error, complete } = {}) {
    this.#next     = next     ?? (() => {});
    this.#error    = error    ?? ((e) => { throw e; });
    this.#complete = complete ?? (() => {});
  }

  get closed() { return this.#closed; }

  next(value) {
    if (this.#closed) return;
    try {
      this.#next(value);
    } catch (err) {
      this.error(err);
    }
  }

  error(err) {
    if (this.#closed) return;
    this.#closed = true;
    this.#runTeardowns();
    this.#error(err);
  }

  complete() {
    if (this.#closed) return;
    this.#closed = true;
    this.#runTeardowns();
    this.#complete();
  }

  // Register a cleanup function (called on error, complete, or unsubscribe)
  addTeardown(fn) {
    if (this.#closed) fn();
    else this.#teardowns.push(fn);
  }

  unsubscribe() {
    if (this.#closed) return;
    this.#closed = true;
    this.#runTeardowns();
  }

  #runTeardowns() {
    this.#teardowns.forEach(fn => { try { fn(); } catch {} });
    this.#teardowns = [];
  }
}


// ── Subscription — returned to callers of .subscribe() ──

export class Subscription {
  #subscriber;
  constructor(subscriber) {
    this.#subscriber = subscriber;
  }
  unsubscribe() { this.#subscriber.unsubscribe(); }
  get closed()  { return this.#subscriber.closed; }
}


// ── Observable ──

export class Observable {
  #subscribeFn;

  constructor(subscribeFn) {
    this.#subscribeFn = subscribeFn;
  }

  subscribe(observerOrNext, error, complete) {
    const observer = typeof observerOrNext === "function"
      ? { next: observerOrNext, error, complete }
      : observerOrNext ?? {};

    const subscriber = new Subscriber(observer);

    try {
      const teardown = this.#subscribeFn(subscriber);
      if (teardown) subscriber.addTeardown(teardown);
    } catch (err) {
      subscriber.error(err);
    }

    return new Subscription(subscriber);
  }

  // ── Pipeable operator support ──
  pipe(...operators) {
    return operators.reduce((obs, op) => op(obs), this);
  }

  // ── Symbol.observable — interop with other libraries ──
  [Symbol.for("observable")]() { return this; }


  // ── Static creation operators ──

  // Emit each argument in sequence, then complete
  static of(...values) {
    return new Observable(subscriber => {
      for (const value of values) {
        if (subscriber.closed) return;
        subscriber.next(value);
      }
      subscriber.complete();
    });
  }

  // Convert any iterable to an Observable
  static from(iterable) {
    if (iterable instanceof Observable) return iterable;

    if (typeof iterable[Symbol.asyncIterator] === "function") {
      return new Observable(async (subscriber) => {
        try {
          for await (const value of iterable) {
            if (subscriber.closed) return;
            subscriber.next(value);
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      });
    }

    return new Observable(subscriber => {
      try {
        for (const value of iterable) {
          if (subscriber.closed) return;
          subscriber.next(value);
        }
        subscriber.complete();
      } catch (err) {
        subscriber.error(err);
      }
    });
  }

  // Never emits or completes
  static never() {
    return new Observable(() => {});
  }

  // Immediately errors
  static throw(err) {
    return new Observable(subscriber => subscriber.error(err));
  }

  // Emit sequential integers on a timer
  static interval(ms) {
    return new Observable(subscriber => {
      let i = 0;
      const id = setInterval(() => subscriber.next(i++), ms);
      return () => clearInterval(id); // teardown
    });
  }

  // Emit once after a delay
  static timer(ms) {
    return new Observable(subscriber => {
      const id = setTimeout(() => {
        subscriber.next(0);
        subscriber.complete();
      }, ms);
      return () => clearTimeout(id);
    });
  }

  // Wrap a DOM event
  static fromEvent(target, eventName) {
    return new Observable(subscriber => {
      const handler = (event) => subscriber.next(event);
      target.addEventListener(eventName, handler);
      return () => target.removeEventListener(eventName, handler);
    });
  }

  // Wrap a Promise
  static fromPromise(promise) {
    return new Observable(subscriber => {
      promise
        .then(value => { subscriber.next(value); subscriber.complete(); })
        .catch(err  => subscriber.error(err));
    });
  }

  // Merge multiple observables — emit from whichever fires first
  static merge(...sources) {
    return new Observable(subscriber => {
      let active = sources.length;
      if (active === 0) { subscriber.complete(); return; }

      const subs = sources.map(source =>
        source.subscribe({
          next:     v => subscriber.next(v),
          error:    e => subscriber.error(e),
          complete: () => { if (--active === 0) subscriber.complete(); },
        })
      );

      return () => subs.forEach(s => s.unsubscribe());
    });
  }

  // Emit latest value from each source as a tuple when any fires
  static combineLatest(...sources) {
    return new Observable(subscriber => {
      const latest   = new Array(sources.length).fill(undefined);
      const hasValue = new Array(sources.length).fill(false);
      let completed  = 0;

      const subs = sources.map((source, i) =>
        source.subscribe({
          next(v) {
            latest[i]   = v;
            hasValue[i] = true;
            if (hasValue.every(Boolean)) subscriber.next([...latest]);
          },
          error: e => subscriber.error(e),
          complete() {
            if (++completed === sources.length) subscriber.complete();
          },
        })
      );

      return () => subs.forEach(s => s.unsubscribe());
    });
  }
}
