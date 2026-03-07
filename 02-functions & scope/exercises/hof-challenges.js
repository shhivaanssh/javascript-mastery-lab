// 1. Implement map, filter, reduce from scratch
function myMap(arr, fn) {
  const result = [];
  for (const item of arr) result.push(fn(item));
  return result;
}

function myFilter(arr, fn) {
  const result = [];
  for (const item of arr) {
    if (fn(item)) result.push(item);
  }
  return result;
}

function myReduce(arr, fn, initial) {
  let acc = initial;
  for (const item of arr) acc = fn(acc, item);
  return acc;
}

myMap([1, 2, 3], n => n * 2);             // [2, 4, 6]
myFilter([1, 2, 3, 4], n => n % 2 === 0); // [2, 4]
myReduce([1, 2, 3, 4], (a, b) => a + b, 0); // 10


// 2. Pipeline — run an array of functions left to right
function pipeline(value, ...fns) {
  return fns.reduce((acc, fn) => fn(acc), value);
}

const result = pipeline(
  "  hello world  ",
  s => s.trim(),
  s => s.split(" "),
  arr => arr.map(w => w[0].toUpperCase() + w.slice(1)),
  arr => arr.join(" ")
);
console.log(result); // "Hello World"


// 3. GroupBy
function groupBy(arr, keyFn) {
  return arr.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

const people = [
  { name: "Alex",   age: 25 },
  { name: "Jordan", age: 30 },
  { name: "Sam",    age: 25 },
  { name: "Taylor", age: 30 },
];

groupBy(people, p => p.age);
// { 25: [{Alex}, {Sam}], 30: [{Jordan}, {Taylor}] }


// 4. Debounce — only fires after the user stops calling for `delay` ms
function debounce(fn, delay) {
  let timer;

  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const onResize = debounce(() => console.log("resize done"), 300);
// calling onResize() 50 times rapidly only fires once, 300ms after the last call


// 5. Throttle — fires at most once per `interval` ms
function throttle(fn, interval) {
  let lastCall = 0;

  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      return fn(...args);
    }
  };
}

const onScroll = throttle(() => console.log("scroll"), 200);
// no matter how fast you scroll, fires at most 5 times per second


// 6. FlatMap from scratch
function myFlatMap(arr, fn) {
  return arr.reduce((acc, item) => acc.concat(fn(item)), []);
}

myFlatMap([1, 2, 3], n => [n, n * 2]); // [1, 2, 2, 4, 3, 6]


// 7. Zip — combine two arrays element by element
function zip(a, b, fn) {
  const len = Math.min(a.length, b.length);
  const result = [];
  for (let i = 0; i < len; i++) {
    result.push(fn(a[i], b[i]));
  }
  return result;
}

zip([1, 2, 3], [4, 5, 6], (a, b) => a + b); // [5, 7, 9]
