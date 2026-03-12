// Module 07 Mini Project — custom-observable
// Run: node index.js
//
// Advanced JS concepts demonstrated:
//   - Classes with private fields and methods
//   - Symbols (Symbol.iterator, Symbol.for)
//   - Iterators (the subscribe chain)
//   - Generators (used in demo 4)
//   - Prototype chain (Observable → Subject → BehaviorSubject)
//   - WeakRef (in WeakCache from exercises)
//   - Proxy (observable pattern in Store)
//   - call/apply (Reflect.apply in operators)

import { Observable } from "./observable.js";
import { Subject, BehaviorSubject, ReplaySubject, Store } from "./subject.js";
import {
  map, filter, take, skip, scan, reduce,
  debounceTime, distinctUntilChanged, tap,
  mergeMap, switchMap, catchError, retry, delay,
} from "./operators.js";


function section(title) {
  console.log(`\n${"═".repeat(54)}`);
  console.log(`  ${title}`);
  console.log("═".repeat(54));
}

function demo(label, fn) {
  console.log(`\n── ${label}`);
  fn();
}


// ────────────────────────────────────────────────────────
// 1. Observable.of — synchronous emission
// ────────────────────────────────────────────────────────
section("1. Observable.of + pipe(map, filter, take)");

demo("transform numbers", () => {
  Observable.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    .pipe(
      filter(n => n % 2 === 0),
      map(n => n * n),
      take(3),
    )
    .subscribe({
      next:     v => console.log("  value:", v),
      complete: () => console.log("  completed"),
    });
  // 4, 16, 36 — squares of first 3 even numbers
});


// ────────────────────────────────────────────────────────
// 2. Observable.from — iterable and generator
// ────────────────────────────────────────────────────────
section("2. Observable.from");

demo("from array", () => {
  const values = [];
  Observable.from([10, 20, 30])
    .pipe(map(n => n + 1))
    .subscribe(v => values.push(v));
  console.log("  result:", values); // [11, 21, 31]
});

demo("from generator", () => {
  function* fibonacci() {
    let [a, b] = [0, 1];
    while (true) { yield a; [a, b] = [b, a + b]; }
  }

  const fibs = [];
  Observable.from(fibonacci())
    .pipe(take(8))
    .subscribe(v => fibs.push(v));

  console.log("  fibonacci:", fibs); // [0, 1, 1, 2, 3, 5, 8, 13]
});


// ────────────────────────────────────────────────────────
// 3. scan and reduce
// ────────────────────────────────────────────────────────
section("3. scan and reduce");

demo("running sum with scan", () => {
  const sums = [];
  Observable.of(1, 2, 3, 4, 5)
    .pipe(scan((acc, v) => acc + v, 0))
    .subscribe(v => sums.push(v));
  console.log("  running sums:", sums); // [1, 3, 6, 10, 15]
});

demo("final sum with reduce", () => {
  Observable.of(10, 20, 30, 40)
    .pipe(reduce((acc, v) => acc + v, 0))
    .subscribe(v => console.log("  total:", v)); // 100
});


// ────────────────────────────────────────────────────────
// 4. Error handling — catchError and retry
// ────────────────────────────────────────────────────────
section("4. Error handling");

demo("catchError — fallback observable", () => {
  const values = [];
  Observable.of(1, 2, 3)
    .pipe(
      map(n => { if (n === 2) throw new Error("bad value"); return n; }),
      catchError(err => {
        console.log("  caught:", err.message);
        return Observable.of(-1); // fallback
      }),
    )
    .subscribe(v => values.push(v));
  console.log("  values:", values); // [1, -1]
});

demo("retry — attempt N times before failing", () => {
  let attempts = 0;
  Observable.of(1)
    .pipe(
      map(() => {
        attempts++;
        if (attempts < 3) throw new Error(`attempt ${attempts} failed`);
        return "success";
      }),
      retry(3),
    )
    .subscribe({
      next:  v => console.log(`  result after ${attempts} attempts:`, v),
      error: e => console.log("  failed:", e.message),
    });
});


// ────────────────────────────────────────────────────────
// 5. Subject — multicast / event bus
// ────────────────────────────────────────────────────────
section("5. Subject — multicast");

demo("multiple subscribers share one stream", () => {
  const subject = new Subject();
  const log1 = [], log2 = [];

  subject.subscribe(v => log1.push(`A:${v}`));
  subject.subscribe(v => log2.push(`B:${v}`));

  subject.next(1);
  subject.next(2);
  subject.next(3);
  subject.complete();

  console.log("  subscriber A:", log1); // ["A:1","A:2","A:3"]
  console.log("  subscriber B:", log2); // ["B:1","B:2","B:3"]
});


// ────────────────────────────────────────────────────────
// 6. BehaviorSubject — current value replay
// ────────────────────────────────────────────────────────
section("6. BehaviorSubject");

demo("new subscribers get the latest value immediately", () => {
  const count$ = new BehaviorSubject(0);

  count$.next(1);
  count$.next(2);

  // Subscribe AFTER emitting — still gets 2 immediately
  const got = [];
  count$.subscribe(v => got.push(v));

  count$.next(3);

  console.log("  values received:", got);  // [2, 3]
  console.log("  current value:  ", count$.value); // 3
});


// ────────────────────────────────────────────────────────
// 7. Store — reactive state container
// ────────────────────────────────────────────────────────
section("7. Store — mini reactive state");

demo("select and update", () => {
  const store = new Store({ count: 0, user: { name: "Alex" } });

  const countLog = [];
  const nameLog  = [];

  store.select(s => s.count).subscribe(v => countLog.push(v));
  store.select(s => s.user.name).subscribe(v => nameLog.push(v));

  store.update(s => ({ ...s, count: s.count + 1 }));
  store.update(s => ({ ...s, count: s.count + 1 }));
  store.update(s => ({ ...s, user: { name: "Jordan" } }));
  store.update(s => ({ ...s, count: s.count + 1 })); // name doesn't change

  console.log("  count changes:", countLog); // [0, 1, 2, 3]
  console.log("  name changes: ", nameLog);  // ["Alex", "Jordan"]
});


// ────────────────────────────────────────────────────────
// 8. mergeMap — flatten async operations
// ────────────────────────────────────────────────────────
section("8. mergeMap");

demo("parallel inner observables", () => {
  const results = [];
  Observable.of("a", "b", "c")
    .pipe(
      mergeMap(letter =>
        Observable.of(`${letter}1`, `${letter}2`)
      ),
    )
    .subscribe(v => results.push(v));
  console.log("  values:", results);
  // ["a1","a2","b1","b2","c1","c2"]
});


// ────────────────────────────────────────────────────────
// 9. distinctUntilChanged + skip
// ────────────────────────────────────────────────────────
section("9. distinctUntilChanged + skip");

demo("filter duplicate emissions", () => {
  const log = [];
  Observable.of(1, 1, 2, 2, 2, 3, 1, 1)
    .pipe(
      distinctUntilChanged(),
      skip(1),
    )
    .subscribe(v => log.push(v));
  console.log("  distinct then skip 1:", log); // [2, 3, 1]
});


// ────────────────────────────────────────────────────────
// 10. Unsubscribe — teardown / cleanup
// ────────────────────────────────────────────────────────
section("10. Unsubscribe — interval cleanup");

demo("cancel a timer after 3 ticks", (done) => {
  const ticks = [];
  const sub = Observable.interval(20)
    .pipe(take(5))
    .subscribe({
      next:     n => ticks.push(n),
      complete: () => console.log("  ticks:", ticks), // [0,1,2,3,4]
    });

  setTimeout(() => {
    console.log("  sub closed:", sub.closed);
  }, 200);
});


console.log("\n✓ All demos complete\n");
