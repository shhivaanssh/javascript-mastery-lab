// Pipeable operators — each returns a function: Observable → Observable
// Use with obs.pipe(map(fn), filter(pred), ...)


import { Observable } from "./observable.js";


// ── Transformation ──

export function map(fn) {
  return (source) => new Observable(subscriber => {
    return source.subscribe({
      next:     v => subscriber.next(fn(v)),
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}

export function filter(pred) {
  return (source) => new Observable(subscriber => {
    return source.subscribe({
      next:     v => { if (pred(v)) subscriber.next(v); },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}

// Flatten one level — subscribe to each inner Observable and emit its values
export function mergeMap(fn) {
  return (source) => new Observable(subscriber => {
    let outerDone  = false;
    let innerCount = 0;
    const innerSubs = new Set();

    const outerSub = source.subscribe({
      next(value) {
        innerCount++;
        const inner = fn(value);
        const innerSub = inner.subscribe({
          next:  v => subscriber.next(v),
          error: e => subscriber.error(e),
          complete() {
            innerSubs.delete(innerSub);
            innerCount--;
            if (outerDone && innerCount === 0) subscriber.complete();
          },
        });
        innerSubs.add(innerSub);
      },
      error:    e => subscriber.error(e),
      complete() {
        outerDone = true;
        if (innerCount === 0) subscriber.complete();
      },
    });

    return () => {
      outerSub.unsubscribe();
      innerSubs.forEach(s => s.unsubscribe());
    };
  });
}

// Switch to a new inner Observable whenever the outer emits — cancel previous inner
export function switchMap(fn) {
  return (source) => new Observable(subscriber => {
    let innerSub  = null;
    let outerDone = false;

    const outerSub = source.subscribe({
      next(value) {
        innerSub?.unsubscribe();
        innerSub = fn(value).subscribe({
          next:  v => subscriber.next(v),
          error: e => subscriber.error(e),
          complete() {
            if (outerDone) subscriber.complete();
          },
        });
      },
      error:    e => subscriber.error(e),
      complete() {
        outerDone = true;
        if (!innerSub || innerSub.closed) subscriber.complete();
      },
    });

    return () => { outerSub.unsubscribe(); innerSub?.unsubscribe(); };
  });
}

export function scan(fn, seed) {
  return (source) => new Observable(subscriber => {
    let acc = seed;
    return source.subscribe({
      next(v) {
        acc = fn(acc, v);
        subscriber.next(acc);
      },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}

export function reduce(fn, seed) {
  return (source) => new Observable(subscriber => {
    let acc     = seed;
    let hasAcc  = seed !== undefined;
    return source.subscribe({
      next(v) {
        if (!hasAcc) { acc = v; hasAcc = true; }
        else acc = fn(acc, v);
      },
      error: e => subscriber.error(e),
      complete() {
        subscriber.next(acc);
        subscriber.complete();
      },
    }).unsubscribe;
  });
}

export function tap(fn) {
  return (source) => new Observable(subscriber => {
    return source.subscribe({
      next(v) { try { fn(v); } catch {} subscriber.next(v); },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}


// ── Filtering ──

export function take(n) {
  return (source) => new Observable(subscriber => {
    let count = 0;
    const sub = source.subscribe({
      next(v) {
        subscriber.next(v);
        if (++count >= n) { subscriber.complete(); sub?.unsubscribe(); }
      },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    });
    return () => sub.unsubscribe();
  });
}

export function skip(n) {
  return (source) => new Observable(subscriber => {
    let count = 0;
    return source.subscribe({
      next:     v => { if (++count > n) subscriber.next(v); },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}

export function distinctUntilChanged(equals = (a, b) => a === b) {
  return (source) => new Observable(subscriber => {
    let last;
    let hasLast = false;
    return source.subscribe({
      next(v) {
        if (!hasLast || !equals(last, v)) {
          last = v; hasLast = true;
          subscriber.next(v);
        }
      },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}

export function first(pred) {
  return (source) => new Observable(subscriber => {
    const sub = source.subscribe({
      next(v) {
        if (!pred || pred(v)) {
          subscriber.next(v);
          subscriber.complete();
          sub?.unsubscribe();
        }
      },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    });
    return () => sub.unsubscribe();
  });
}


// ── Time-based ──

export function debounceTime(ms) {
  return (source) => new Observable(subscriber => {
    let timer;
    return source.subscribe({
      next(v) {
        clearTimeout(timer);
        timer = setTimeout(() => subscriber.next(v), ms);
      },
      error: e => subscriber.error(e),
      complete() {
        clearTimeout(timer);
        subscriber.complete();
      },
    }).unsubscribe;
  });
}

export function throttleTime(ms) {
  return (source) => new Observable(subscriber => {
    let last = 0;
    return source.subscribe({
      next(v) {
        const now = Date.now();
        if (now - last >= ms) { last = now; subscriber.next(v); }
      },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}

export function delay(ms) {
  return (source) => new Observable(subscriber => {
    const timers = new Set();
    return source.subscribe({
      next(v) {
        const id = setTimeout(() => { timers.delete(id); subscriber.next(v); }, ms);
        timers.add(id);
      },
      error:    e => subscriber.error(e),
      complete: () => subscriber.complete(),
    }).unsubscribe;
  });
}


// ── Error handling ──

export function catchError(fn) {
  return (source) => new Observable(subscriber => {
    let innerSub;
    const sub = source.subscribe({
      next:  v => subscriber.next(v),
      error(e) {
        const fallback = fn(e);
        innerSub = fallback.subscribe({
          next:     v => subscriber.next(v),
          error:    e2 => subscriber.error(e2),
          complete: () => subscriber.complete(),
        });
      },
      complete: () => subscriber.complete(),
    });
    return () => { sub.unsubscribe(); innerSub?.unsubscribe(); };
  });
}

export function retry(count) {
  return (source) => new Observable(subscriber => {
    let attempts = 0;
    let currentSub;

    function attempt() {
      currentSub = source.subscribe({
        next:  v => subscriber.next(v),
        error(e) {
          if (attempts++ < count) attempt();
          else subscriber.error(e);
        },
        complete: () => subscriber.complete(),
      });
    }

    attempt();
    return () => currentSub?.unsubscribe();
  });
}
