// A Subject is both an Observable and an Observer.
// It's "hot" — emits regardless of whether anyone is subscribed.
// All subscribers share the same stream (multicast).
//
// Use cases: user events, state changes, cross-component communication.


import { Observable, Subscription } from "./observable.js";


// ── Subject ──

export class Subject extends Observable {
  #observers = new Set();
  #closed    = false;

  constructor() {
    super(subscriber => {
      if (this.#closed) { subscriber.complete(); return; }
      this.#observers.add(subscriber);
      subscriber.addTeardown(() => this.#observers.delete(subscriber));
    });
  }

  get observers() { return this.#observers.size; }
  get closed()    { return this.#closed; }

  next(value) {
    if (this.#closed) return;
    this.#observers.forEach(s => s.next(value));
  }

  error(err) {
    if (this.#closed) return;
    this.#closed = true;
    this.#observers.forEach(s => s.error(err));
    this.#observers.clear();
  }

  complete() {
    if (this.#closed) return;
    this.#closed = true;
    this.#observers.forEach(s => s.complete());
    this.#observers.clear();
  }

  // Turn any Observable into a Subject (multicast)
  asObservable() {
    return new Observable(subscriber => this.subscribe(subscriber));
  }
}


// ── BehaviorSubject — holds the latest value, replays it to new subscribers ──

export class BehaviorSubject extends Subject {
  #value;

  constructor(initial) {
    super();
    this.#value = initial;
  }

  get value() { return this.#value; }

  next(value) {
    this.#value = value;
    super.next(value);
  }

  subscribe(observer, ...rest) {
    const sub = super.subscribe(observer, ...rest);
    // Replay current value to new subscriber immediately
    if (!sub.closed) {
      const subscriber = typeof observer === "function"
        ? { next: observer }
        : observer;
      subscriber?.next?.(this.#value);
    }
    return sub;
  }
}


// ── ReplaySubject — buffers last N values, replays to new subscribers ──

export class ReplaySubject extends Subject {
  #buffer = [];
  #bufferSize;

  constructor(bufferSize = Infinity) {
    super();
    this.#bufferSize = bufferSize;
  }

  next(value) {
    this.#buffer.push(value);
    if (this.#buffer.length > this.#bufferSize) this.#buffer.shift();
    super.next(value);
  }

  subscribe(observer, ...rest) {
    const sub = super.subscribe(observer, ...rest);
    const subscriber = typeof observer === "function"
      ? { next: observer }
      : observer;
    this.#buffer.forEach(v => subscriber?.next?.(v));
    return sub;
  }
}


// ── Store — BehaviorSubject with update function, like a mini Redux ──

export class Store extends Observable {
  #state$;

  constructor(initialState) {
    const state$ = new BehaviorSubject(initialState);
    super(subscriber => state$.subscribe(subscriber));
    this.#state$ = state$;
  }

  get value() { return this.#state$.value; }

  update(fn) {
    this.#state$.next(fn(this.#state$.value));
  }

  set(newState) {
    this.#state$.next(newState);
  }

  select(selectorFn) {
    return new Observable(subscriber => {
      let prevSelected;
      return this.#state$.subscribe({
        next(state) {
          const selected = selectorFn(state);
          if (selected !== prevSelected) {
            prevSelected = selected;
            subscriber.next(selected);
          }
        },
        error:    e => subscriber.error(e),
        complete: () => subscriber.complete(),
      }).unsubscribe;
    });
  }
}
